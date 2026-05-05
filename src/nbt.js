const TAG = Object.freeze({
  End: 0,
  Byte: 1,
  Int: 3,
  String: 8,
  List: 9,
  Compound: 10,
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
