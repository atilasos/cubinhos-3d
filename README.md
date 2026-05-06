# Cubinhos 3D — Construtor Voxel para Minecraft Education

Cubinhos 3D é uma aplicação estática para alunos do 1.º ciclo planearem construções em blocos reais do Minecraft. Usa um único ficheiro `.mcstructure` para guardar, abrir novamente no Cubinhos 3D e importar no Minecraft Education/Bedrock.

## Como usar

1. Abre `index.html` ou publica este repositório no GitHub Pages.
2. Escolhe um bloco na paleta organizada por famílias de cores e materiais.
3. Constrói por camadas, usa o **modo isométrico assistido**, ou muda para o novo **modo 3D**.
4. No modo 3D, aponta para uma face, confirma o cubinho fantasma e clica para colocar ou apagar como no Minecraft Education.
5. Usa rotação e zoom para ver à volta; no canvas podes segurar o botão direito e arrastar para rodar, e usar a roda do rato para aproximar/afastar.
6. Clica em **Descarregar .mcstructure** para guardar o projeto num ficheiro.
7. Mais tarde, usa **Abrir .mcstructure** para continuar a editar o mesmo projeto.
8. O mesmo ficheiro também pode ser usado em **Usar no Minecraft** / Structure Block.

## Ficheiro único `.mcstructure`

A interface deixou de usar ficheiros JSON para projetos. O formato visível para professores e crianças é apenas `.mcstructure`.

O Cubinhos 3D também tenta abrir estruturas `.mcstructure` simples criadas fora da aplicação. Esta importação é **best-effort**:

- importa blocos simples através da paleta da estrutura;
- respeita o limite 32×32×32 da sala de aula;
- ignora entidades, baús, inventários, redstone, dados avançados de blocos e camada secundária;
- mostra avisos amigáveis quando alguma parte não é suportada.

## Importar no Minecraft Education / Bedrock

A documentação Microsoft Learn para Structure Blocks indica que a importação de `.mcstructure` através do botão **Import** é limitada à versão Windows do jogo. Em Minecraft Education, o Structure Block exige permissões de World Builder/anfitrião.

Fluxo recomendado:

1. Abre um mundo criativo suportado no Minecraft Education/Bedrock para Windows.
2. Obtém um Structure Block com `/give @s structure_block`.
3. Coloca o bloco e muda para modo **Load**.
4. Usa **Import** para escolher o ficheiro `.mcstructure` exportado.
5. Confirma a caixa de limites e clica em **Load**.

## Escopo atual

Incluído:
- site estático compatível com GitHub Pages;
- grelha 32×32×32;
- paleta infantil com mais materiais reais do Minecraft, organizada por cores/famílias;
- colocar, apagar, preencher camada, desfazer/refazer;
- modo isométrico assistido por camada com rotação, zoom e mapa de orientação;
- modo 3D simples com edição por faces visíveis, bloco fantasma, rotação e zoom;
- rotação com botão direito do rato e zoom com roda dentro do canvas de construção;
- guardar/abrir localmente no browser;
- descarregar e abrir projetos como `.mcstructure`;
- importar `.mcstructure` simples sem entidades.

Fora de escopo:
- multiplayer;
- contas, servidor ou base de dados;
- inventário completo do Minecraft;
- entidades, redstone, baús, comandos, mobs ou NBT avançado;
- editor 3D profissional;
- avatar, física, gravidade, WASD ou mundo infinito;
- importação perfeita de qualquer `.mcstructure` externo.

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
