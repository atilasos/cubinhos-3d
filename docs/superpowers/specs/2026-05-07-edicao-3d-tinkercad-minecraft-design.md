# Edição 3D estilo Tinkercad + Minecraft Education — design

**Data:** 2026-05-07
**Estado:** validado em brainstorming, pronto para plano de implementação
**Público-alvo:** alunos do 1.º ciclo, em portáteis/desktops da escola com rato e teclado.

## Contexto e problema

O Cubinhos 3D actual oferece três modos: camadas, isométrico assistido e um "modo 3D" que é, na prática, uma projecção isométrica em canvas 2D. Em sala de aula com crianças do 1.º ciclo, observam-se quatro problemas dominantes:

1. **Perdem-se no espaço** — a rotação suportada é limitada, não há orbit livre, e não existe ponto de referência claro.
2. **Colocação de blocos pouco intuitiva** — exige duas etapas (mostrar fantasma, confirmar com clique), em vez do clique único do Minecraft.
3. **Canvas demasiado pequeno** — em monitores escolares de 1366×768, o cabeçalho, paleta lateral e barra de modos ocupam metade do ecrã.
4. **Aspecto árido** — parece um editor técnico, não convida a brincar.

A meta é uma ferramenta que as crianças dominem em poucos minutos e que sirva de "rascunho 3D" rápido antes de levarem a construção para o Minecraft Education.

## Visão

Substituir os três modos actuais por um único **modo 3D real** com:

- **Câmara orbital tipo Tinkercad** (botão direito = rodar, roda do rato = zoom), reforçada com ViewCube + setas ⟲⟳ + botão 🏠 para crianças que ainda não dominem o rato direito.
- **Colocação de blocos tipo Minecraft Education** (ferramenta activa + clique único, com arrastar a pintar em fila).
- **Canvas que ocupa quase todo o ecrã**, com lateral fina à esquerda e gaveta de paleta flutuante em baixo.
- **Aspecto pixel-art Minecraft** com texturas 16×16 fiéis, plataforma de chão azul-pastel e UI em tipografia arredondada.

A camada de dados (`model.js`, `.mcstructure`, undo/redo, limite 32³) fica intacta. Só muda renderização, captura de input e UI.

## Princípios de design

- **O canvas é o herói.** Cada pixel poupado à interface é pixel ganho à construção.
- **Zonas de clique inequívocas.** Um gesto faz uma coisa, sem ambiguidade pelo contexto. Botões de UI nunca disputam input com a câmara.
- **Rede de segurança redundante.** Nenhum gesto avançado (botão direito, atalhos) é a única forma de fazer algo crítico — há sempre um botão grande clicável.
- **Reconhecimento, não memorização.** Texturas, cores e ícones (🧱 🧽 💧 🪣) reduzem a carga cognitiva.
- **Fronteiras claras de módulo.** O modelo de dados não conhece o renderer; o renderer não muta o modelo. Tudo flui via `app.js` orquestrador.

## Modelo de interacção

### Câmara

| Gesto | Acção |
|---|---|
| Arrastar com **botão direito** dentro do canvas | Orbita yaw + pitch à volta do centro da maquete (pitch limitado para não inverter) |
| **Roda do rato** | Zoom in/out, com limites |
| **Shift + botão direito** arrastar | Pan lateral (avançado, não documentado para crianças) |
| Clique numa face do **ViewCube** | Câmara salta para vista alinhada (Frente/Cima/Direita/Atrás/Baixo/Esquerda) |
| Clique numa aresta do ViewCube | Vista isométrica entre duas faces |
| Setas **⟲ ⟳** abaixo do ViewCube | Rodam a câmara 45° |
| Botão **🏠** | Repõe vista isométrica inicial |
| Tecla **Espaço** | Equivalente a 🏠 |

O ViewCube roda em sincronia com a câmara, funcionando como bússola visual.

### Construção

A barra lateral esquerda contém uma **ferramenta activa** (sempre uma e só uma):

| Ferramenta | Ícone | Atalho | Efeito ao clicar numa face |
|---|---|---|---|
| Construir | 🧱 | `1` | Coloca um bloco do tipo seleccionado adjacente à face apontada |
| Apagar | 🧽 | `2` | Remove o bloco apontado |
| Pintar | 💧 | `3` | Substitui o bloco apontado pelo tipo seleccionado |
| Encher camada | 🪣 | `4` | Flood fill na camada Y do bloco apontado: substitui células contíguas do mesmo tipo (ou vazias, se a face apontada for o topo) pelo bloco seleccionado |

Por baixo: **↶ ↷** undo/redo (também `Ctrl+Z` / `Ctrl+Shift+Z`).

**Cubinho fantasma:** ao passar o rato sobre uma face, mostra-se uma pré-visualização semi-transparente do efeito da ferramenta — cubo do bloco actual em opacidade 50%, ou aro vermelho se for apagar.

**Clique esquerdo** numa face aplica a ferramenta. Sem confirmação dupla. **Arrastar com o botão esquerdo** sobre várias faces aplica em fila (drag-paint).

A regra discriminadora entre câmara e construção:

- **Botão esquerdo** → sempre construção. Nunca move a câmara.
- **Botão direito** → sempre câmara. Nunca constrói.

Esta separação elimina a ambiguidade do "depende se cliquei sobre face ou vazio".

### Ajudas espaciais sempre visíveis

- **ViewCube** (54×54px, canto superior direito do canvas) com setas ⟲⟳, 🏠 e atalho Espaço.
- **Plataforma de chão** 32×32 azul-pastel `#cfeaff` com grelha 1×1 a `rgba(0,0,0,.06)` e bússola N/S/E/O nas margens.
- **Caixa de limites 32³** a tracejado fino, ligeiramente luminosa quando o cursor se aproxima de um limite.

### Paleta de blocos

Gaveta flutuante centrada em baixo do canvas. 8 blocos visíveis em fila + botão **▾** que abre painel completo organizado por famílias de cor/material. A gaveta minimiza-se para faixa fina via botão.

## Aspecto visual

### Cena 3D

- Fundo: gradiente azul-céu suave (sem nuvens nem sol — limpo, não distrai).
- Plataforma de chão: `#cfeaff` com grelha discreta; margens ligeiramente mais escuras com letras N/S/E/O.
- Iluminação: uma luz direccional de cima-trás-direita + luz ambiente forte (~0.6) para nenhuma face ficar preta. Sombras desactivadas (custo + ruído visual).
- Blocos: texturas oficiais 16×16 do Minecraft Java Edition em `assets/blocks/*.png`, renderizadas com `THREE.NearestFilter` para preservar pixels.
- Cubinho fantasma: 50% opacidade + aro pulsante amarelo na face apontada. Modo apagar: aro vermelho pulsante, sem fantasma.

### UI HTML

- Tipografia: `system-ui` no corpo; `Fredoka` (Google Fonts) nos títulos — arredondada, lúdica, legível.
- Paleta: `#ffd66e` para ferramenta activa e CTA primário, `#1d1d1d` texto, `#ffffff` superfícies. Sem gradientes na UI; planos chapados com cantos 10–14px.
- Botões da lateral: 48×48px, ícones emoji.
- Animações curtas (150ms): seleccionar ferramenta, colocar bloco (pop 0.9→1), trocar vista no ViewCube (250ms).
- Cabeçalho actual passa a barra fina de 44px: nome "Cubinhos 3D" à esquerda, botões de ficheiro à direita (Abrir/Guardar/Descarregar/Usar no Minecraft).

### Acessibilidade

- Contraste AA em todos os textos.
- `aria-label` descritivo em todos os botões.
- Atalhos de teclado para todas as acções principais.
- Toggle "modo cores chapadas" em `localStorage` (sem texturas) para alunos com dificuldade visual ou ecrãs muito fracos.

## Estrutura técnica

### Dependência nova

Three.js via ESM/CDN, versão fixada (0.164.x ou superior estável no momento da implementação) com SRI:

```html
<script type="importmap">
  { "imports": { "three": "https://unpkg.com/three@0.164.0/build/three.module.js" } }
</script>
```

A versão exacta é confirmada na fase de plano de implementação e pode subir desde que o teste de import e o exemplo de `InstancedMesh` continuem a funcionar.

Sem build step. Continua a abrir `index.html` directamente. Compatível com GitHub Pages.

### Ficheiros

| Ficheiro | Estado | Responsabilidade |
|---|---|---|
| `src/model.js` | mantém | Estado dos voxels, undo/redo, limites 32³. Autoritário. |
| `src/blocks.js` | mantém + estende | Paleta + mapeamento bloco→textura. Adiciona `texturePath`. |
| `src/mcstructure.js` | mantém | Importar/exportar `.mcstructure`. |
| `src/nbt.js` | mantém | Sem alterações. |
| `src/isometric.js` | **remove** | Renderer 2D antigo. |
| `src/scene.js` | **novo** | Cena Three.js, câmara, luzes, plataforma, caixa de limites, ViewCube. |
| `src/voxel-mesh.js` | **novo** | Reconstrói a malha a partir do `model`. `InstancedMesh` por tipo de bloco. |
| `src/raycaster.js` | **novo** | Picking pointer→face/voxel/normal. |
| `src/controls.js` | **novo** | Câmara orbital, ViewCube, setas ⟲⟳, 🏠, atalhos. |
| `src/tools.js` | **novo** | Ferramenta activa, aplica ao voxel-alvo, gere drag-paint. |
| `src/app.js` | **reduz** | Só orquestração: model ↔ scene ↔ tools ↔ UI. ~200 linhas (de 665). |
| `assets/blocks/*.png` | **novo** | Texturas 16×16. |
| `index.html` | **reduz** | Cabeçalho fino, lateral, gaveta de paleta, canvas Three.js. Sem switch de modos. |
| `styles.css` | **substitui largamente** | Novo layout, tipografia, cores, animações. |

### Fronteiras de módulo

- `model` não conhece Three.js. Testável em Node sem DOM (já é o caso).
- `scene`, `voxel-mesh`, `raycaster`, `controls` não tocam directamente no `model`. Tudo flui via `app.js`.
- `tools` recebe um *target* do raycaster e despacha mutações ao `model`. Não conhece Three.js.

### Performance

- 32×32×32 = 32 768 cubos máximos. Com `InstancedMesh` por tipo de bloco, a contagem efectiva de draw calls fica baixa.
- Raycasting próprio (não Three.js padrão) directo contra a grelha do `model`: O(comprimento do raio em voxels), independentemente do número de cubos.
- Reconstrução de malha granular: actualizar só a instância afectada quando muda um único voxel.

### Testes

- Testes existentes (`model`, `mcstructure`, `nbt`) passam sem alteração.
- Novos testes para utilities puros de `raycaster` e `tools` (coordenadas voxel/face → resultado esperado).
- Sem testes Three.js end-to-end.

### Migração

- Projectos `.mcstructure` existentes abrem na nova versão (mesma camada de dados).
- Estado guardado em `localStorage` mantém-se compatível.

## Fora de escopo

- Multiplayer ou colaboração.
- Sons e música.
- Sombras dinâmicas, reflexões, partículas.
- Movimento WASD / "andar dentro" da maquete (modelo mental: maquete na mesa, não jogo).
- Inventário completo, redstone, entidades, mobs, NBT avançado.
- Importação perfeita de `.mcstructure` externos (continua best-effort).
- Pan da câmara documentado para crianças (existe via Shift + botão direito, sem ajuda visível).
- Modo de "fatia"/focar camada (eliminado nesta entrega; possível extensão futura como raio-X).
- Tablets e toque (próxima fase).
- Internacionalização (continua só pt-PT).
- Animações exuberantes (ficam micro-animações funcionais de 150ms).

## Critérios de sucesso

- Aluno do 1.º ciclo coloca o primeiro bloco em <30 segundos sem instrução verbal.
- Aluno consegue rodar a câmara para ver a parte de trás da maquete por dois caminhos: (a) botão direito ou (b) ViewCube/setas.
- Em monitor 1366×768, o canvas ocupa pelo menos 75% da altura útil.
- Construir uma parede de 5 blocos demora ≤ 5 segundos com drag-paint.
- Ficheiro `.mcstructure` exportado abre no Minecraft Education sem diferenças face ao formato actual.
- Testes existentes continuam a passar.
