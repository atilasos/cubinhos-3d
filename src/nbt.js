const TAG = Object.freeze({
  End: 0,
  Byte: 1,
  Short: 2,
  Int: 3,
  Long: 4,
  Float: 5,
  Double: 6,
  ByteArray: 7,
  String: 8,
  List: 9,
  Compound: 10,
  IntArray: 11,
  LongArray: 12,
});

export { TAG };

export class NbtWriter {
  constructor() {
    this.bytes = [];
  }

  toUint8Array() {
    return Uint8Array.from(this.bytes);
  }

  u8(value) { this.bytes.push(value & 0xff); }

  i16(value) {
    this.u8(value);
    this.u8(value >> 8);
  }

  i32(value) {
    this.u8(value);
    this.u8(value >> 8);
    this.u8(value >> 16);
    this.u8(value >> 24);
  }

  utf8(text) {
    const encoded = new TextEncoder().encode(text);
    this.i16(encoded.length);
    for (const byte of encoded) this.u8(byte);
  }

  namedTag(type, name, writePayload) {
    this.u8(type);
    this.utf8(name);
    writePayload();
  }

  rootCompound(writePayload) {
    this.u8(TAG.Compound);
    this.utf8('');
    writePayload();
    this.u8(TAG.End);
    return this.toUint8Array();
  }

  byte(name, value) {
    this.namedTag(TAG.Byte, name, () => this.u8(value));
  }

  int(name, value) {
    this.namedTag(TAG.Int, name, () => this.i32(value));
  }

  string(name, value) {
    this.namedTag(TAG.String, name, () => this.utf8(value));
  }

  compound(name, writePayload) {
    this.namedTag(TAG.Compound, name, () => {
      writePayload();
      this.u8(TAG.End);
    });
  }

  emptyCompound(name) {
    this.compound(name, () => {});
  }

  intList(name, values) {
    this.namedTag(TAG.List, name, () => {
      this.u8(TAG.Int);
      this.i32(values.length);
      for (const value of values) this.i32(value);
    });
  }

  compoundList(name, items) {
    this.namedTag(TAG.List, name, () => {
      this.u8(TAG.Compound);
      this.i32(items.length);
      for (const item of items) {
        item(this);
        this.u8(TAG.End);
      }
    });
  }

  emptyCompoundList(name) {
    this.compoundList(name, []);
  }

  listOfIntLists(name, lists) {
    this.namedTag(TAG.List, name, () => {
      this.u8(TAG.List);
      this.i32(lists.length);
      for (const list of lists) {
        this.u8(TAG.Int);
        this.i32(list.length);
        for (const value of list) this.i32(value);
      }
    });
  }
}

export class NbtReader {
  constructor(bytes) {
    if (bytes instanceof ArrayBuffer) {
      this.bytes = new Uint8Array(bytes);
    } else if (ArrayBuffer.isView(bytes)) {
      this.bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    } else {
      throw new TypeError('NBT data must be an ArrayBuffer or Uint8Array');
    }
    this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
    this.offset = 0;
    this.decoder = new TextDecoder();
  }

  rootCompound() {
    const type = this.u8();
    if (type !== TAG.Compound) throw new Error('ficheiro .mcstructure inválido: raiz NBT não é Compound');
    this.string();
    return this.compoundPayload();
  }

  ensure(length) {
    if (this.offset + length > this.bytes.byteLength) {
      throw new Error('ficheiro .mcstructure incompleto ou corrompido');
    }
  }

  u8() {
    this.ensure(1);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  i8() {
    this.ensure(1);
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  i16() {
    this.ensure(2);
    const value = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return value;
  }

  u16() {
    this.ensure(2);
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  i32() {
    this.ensure(4);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  i64() {
    this.ensure(8);
    const value = this.view.getBigInt64(this.offset, true);
    this.offset += 8;
    return value;
  }

  f32() {
    this.ensure(4);
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  f64() {
    this.ensure(8);
    const value = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    return value;
  }

  string() {
    const length = this.u16();
    this.ensure(length);
    const value = this.decoder.decode(this.bytes.subarray(this.offset, this.offset + length));
    this.offset += length;
    return value;
  }

  compoundPayload() {
    const result = {};
    while (true) {
      const type = this.u8();
      if (type === TAG.End) return result;
      const name = this.string();
      result[name] = this.payload(type);
    }
  }

  payload(type) {
    switch (type) {
      case TAG.Byte: return this.i8();
      case TAG.Short: return this.i16();
      case TAG.Int: return this.i32();
      case TAG.Long: return this.i64();
      case TAG.Float: return this.f32();
      case TAG.Double: return this.f64();
      case TAG.ByteArray: return this.arrayPayload(() => this.i8());
      case TAG.String: return this.string();
      case TAG.List: return this.listPayload();
      case TAG.Compound: return this.compoundPayload();
      case TAG.IntArray: return this.arrayPayload(() => this.i32());
      case TAG.LongArray: return this.arrayPayload(() => this.i64());
      default: throw new Error(`tipo NBT não suportado: ${type}`);
    }
  }

  arrayPayload(readItem) {
    const length = this.i32();
    if (length < 0) throw new Error('lista NBT inválida');
    return Array.from({ length }, readItem);
  }

  listPayload() {
    const itemType = this.u8();
    const length = this.i32();
    if (length < 0) throw new Error('lista NBT inválida');
    if (itemType === TAG.End && length === 0) return [];
    return Array.from({ length }, () => this.payload(itemType));
  }
}

export function parseNbt(bytes) {
  return new NbtReader(bytes).rootCompound();
}
