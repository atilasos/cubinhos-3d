# Cubinhos 3D — Construtor Voxel para Minecraft Education

Cubinhos 3D é uma aplicação estática para alunos do 1.º ciclo planearem construções em blocos reais do Minecraft. Usa um único ficheiro `.mcstructure` para guardar, abrir novamente no Cubinhos 3D e importar no Minecraft Education/Bedrock.

## Como usar

1. Abre `index.html` ou publica este repositório no GitHub Pages.
2. Escolhe uma ferramenta na lateral esquerda: 🧱 Construir · 🧽 Apagar · 💧 Pintar · 🪣 Encher (atalhos `1` `2` `3` `4`).
3. Escolhe um bloco na paleta em baixo. ▾ "mais" mostra todos por categoria.
4. **Botão esquerdo** numa face do canvas aplica a ferramenta. Arrastar pinta em fila.
5. **Botão direito + arrastar** roda a câmara à volta da maquete. **Roda do rato** faz zoom.
6. ViewCube no canto direito salta para vistas alinhadas. ⟲ ⟳ rodam 45°. 🏠 (ou `Espaço`) repõe.
7. **Guardar / Abrir** mantém o projecto no browser. **Descarregar .mcstructure** exporta para Minecraft Education.

## Importar no Minecraft Education / Bedrock

A documentação Microsoft Learn para Structure Blocks indica que a importação de `.mcstructure` através do botão **Import** é limitada à versão Windows do jogo. Em Minecraft Education, o Structure Block exige permissões de World Builder/anfitrião.

Fluxo recomendado:

1. Abre um mundo criativo suportado no Minecraft Education/Bedrock para Windows.
2. Obtém um Structure Block com `/give @s structure_block`.
3. Coloca o bloco e muda para modo **Load**.
4. Usa **Import** para escolher o ficheiro `.mcstructure` exportado.
5. Confirma a caixa de limites e clica em **Load**.

## Ficheiro único `.mcstructure`

A interface só usa `.mcstructure` para guardar, abrir e exportar. O Cubinhos 3D também tenta abrir estruturas `.mcstructure` simples criadas fora da aplicação — esta importação é **best-effort**: importa blocos da paleta, respeita o limite 32×32×32, ignora entidades, baús, inventários, redstone e dados avançados.

## Escopo actual

Incluído:
- editor 3D real (Three.js 0.164) com câmara orbital tipo Tinkercad;
- ferramentas activas tipo Minecraft Education (clique único + drag-paint);
- ViewCube + setas ⟲ ⟳ + 🏠 + caixa de limites tracejada + plataforma de chão azul-pastel;
- texturas pixel-art geradas proceduralmente a partir da cor de cada bloco (16×16 com `NearestFilter`);
- paleta organizada por famílias, com 8 populares sempre visíveis e gaveta para todos;
- guardar/abrir no browser e como `.mcstructure`.

Fora de escopo:
- multiplayer, contas, base de dados;
- inventário completo, redstone, entidades, mobs, NBT avançado;
- WASD, física, gravidade, andar dentro do mundo;
- texturas Minecraft oficiais (problemas de copyright — usamos procedurais);
- tablets/toque (próxima fase).

## Adicionar blocos novos

A paleta tem 64 blocos correspondentes às células dos atlas em `assets/blocks/`:

| Atlas | Grelha | Conteúdo |
|---|---|---|
| `atlas-natural.png` | 4×4 | naturais (relva, terra, troncos, …) |
| `atlas-cor.png` | 8×4 | concrete (16) + wool (16) |
| `atlas-especial.png` | 4×4 | especiais (gold, diamond, glowstone, …) |

Para acrescentar um bloco:

1. Edita o PNG correspondente preservando a grelha lógica (mesma divisão de células).
2. Em `src/blocks.js`, acrescenta uma entrada com o ID `minecraft:*` real, `name`, `color` (hex aproximado), `category`, `atlas` e `(col, row)`.
3. As coordenadas `col` e `row` são índices a partir de zero, com `(0, 0)` no canto superior-esquerdo do PNG.
4. Se o atlas ficar cheio, aumenta `cols` ou `rows` em `src/atlas.js` e ajusta o PNG.

A função pura `getAtlasTransform({cols, rows, col, row})` em `src/atlas.js` calcula `offset/repeat` para Three.js (com a inversão vertical UV).

## Desenvolvimento

```bash
npm test
npm start
```

Depois abre `http://localhost:8000`.

## Fontes técnicas

- Bedrock Wiki `.mcstructure`: https://wiki.bedrock.dev/nbt/mcstructure
- Microsoft Learn Structure Blocks: https://learn.microsoft.com/en-us/minecraft/creator/documents/structures/introductiontostructureblocks?view=minecraft-bedrock-stable
- Minecraft Education Specialty Blocks: https://edusupport.minecraft.net/hc/en-us/articles/360047116852-Specialty-Blocks-Allow-Deny-Border-Structure
