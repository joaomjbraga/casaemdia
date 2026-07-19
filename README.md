![banner](./.github/casaemdia.jpg)

# Casa em Dia

**Casa em Dia** é um aplicativo mobile para organização doméstica, desenvolvido com React Native e Expo. O app permite gerenciar tarefas, compras e atividades do lar de forma integrada — com suporte a **famílias compartilhadas** e sistema de **gamificação**.

> **Marco inicial (rebranch):** este é o ponto de partida da nova base de código do
> **Casa em Dia**. A partir deste commit inicial, a arquitetura foi reorganizada em
> torno de **famílias compartilhadas**, com autenticação Google, Firestore em tempo
> real e notificações push via OneSignal.

## Funcionalidades

- **Login com Google Sign-In** (via Firebase Auth)
- **Família compartilhada** — convite por email, dados sincronizados entre membros
- **Tarefas** com pontos, responsáveis e ranking de gamificação
- **Lista de compras** colaborativa — itens comprados também rendem pontos
- **Gamificação persistida** — pontos, tarefas/conquistas concluídas e contribuições são creditados por membro no Firestore ao concluir tarefas (pontos da tarefa) ou comprar itens (pontos fixos), com estorno ao reabrir
- **Comemoração** — animação de confete + som (`celebration.wav`) quando todas as tarefas ou compras são concluídas
- **Notificações push** via OneSignal com som personalizado (9 tipos de notificação)
- **Tema escuro único** com visual glassmorphism (Aurora, MeshGradient, Glow)
- **Dock tab bar** estilo macOS com magnificação
- **Persistência offline** nativa do Firestore

## Sistema de Família

O app suporta **famílias compartilhadas** — múltiplos usuários acessam os mesmos dados.

### Como funciona

1. **Primeiro login** → cria automaticamente uma família e migra dados existentes
2. **Admin** (criador) convida membros por email
3. **Convidado** vê o convite no Dashboard e aceita
4. **Todos os dados** (tarefas, compras) ficam compartilhados

### Estrutura Firestore

```
families/{familyId}
  ├── name: string
  ├── createdBy: string (uid)
  ├── createdAt: Timestamp
  │
  ├── members/{userId}
  │     ├── name: string
  │     ├── email: string
  │     ├── photoURL: string | null
  │     ├── role: 'admin' | 'member'
  │     ├── joinedAt: Timestamp
  │     ├── points: number                  ← gamificação (total de pontos)
  │     ├── tasksCompleted: number          ← gamificação (tarefas concluídas)
  │     ├── shoppingCompleted: number        ← gamificação (compras concluídas)
  │     └── contributions: number           ← gamificação (total de conclusões)
  │
  ├── tasks/{docId}
  │     ├── title: string
  │     ├── done: boolean
  │     ├── assignee: string (nome do membro)
  │     ├── points: number
  │     └── created_at: Timestamp
  │
  ├── shopping_list/{docId}
  │     ├── title: string
  │     ├── done: boolean
  │     ├── quantity: string (opcional)
  │     └── points: number (fixo: 3 por item)
  │
  ├── inventory/{docId}          ← planejado
  ├── expenses/{docId}           ← planejado
  └── balance/current            ← planejado

invitations/{invitationId}       ← coleção top-level
  ├── familyId: string
  ├── familyName: string
  ├── fromUserId: string
  ├── fromUserName: string
  ├── toEmail: string
  ├── status: 'pending' | 'accepted' | 'declined' | 'expired'
  └── createdAt: Timestamp

users/{uid}
  ├── familyId: string
  ├── familyName: string
  └── migratedAt: Timestamp
```

### Regras de Segurança (Firestore)

As regras versionadas estão em [`firestore.rules`](./firestore.rules). Elas garantem que:

- Somente **membros** da família leiam ou alterem os dados
- Somente **admins** enviem convites e promovam/removam membros
- Um membro **não possa se auto-promover** a admin (proteção contra privilege escalation)
- Um membro possa atualizar seus próprios campos de gamificação (`points`, `tasksCompleted`, `shoppingCompleted`, `contributions`) ao concluir/reabrir atividades
- O destinatário possa aceitar ou recusar apenas o **próprio convite**
- Convites com status `expired` sejam tratados corretamente
- Convites possam ser **excluídos** pelo destinatário

Para publicar as regras, após autenticar e selecionar o projeto Firebase:

```bash
npx firebase-tools login
npx firebase-tools use <project-id>
npx firebase-tools deploy --only firestore:rules
```

O aceite de convite cria o membro, muda `users/{uid}.familyId` e atualiza o convite em uma única operação atômica. A criação inicial de família também é atômica para que as regras possam validar o primeiro administrador.

### Notificações Push (OneSignal)

O app envia notificações push para todos os membros da família (exceto o autor da ação) nos seguintes eventos:

| Evento | Título | Exemplo |
|--------|--------|---------|
| Tarefa criada | `Nova tarefa` | "João criou a tarefa "Lavar a louça" para Maria" |
| Tarefa concluída | `Tarefa concluída` | "João concluiu a tarefa "Lavar a louça"" |
| Tarefa reaberta | `Tarefa reaberta` | "João reabriu a tarefa "Lavar a louça"" |
| Tarefa excluída | `Tarefa removida` | "João removeu a tarefa "Lavar a louça"" |
| Todas tarefas excluídas | `Tarefas limpas` | "João removeu todas as tarefas" |
| Item adicionado à compra | `Item adicionado` | "João adicionou "Leite" na lista de compras" |
| Item comprado | `Item comprado` | "João comprou "Leite"" |
| Item desmarcado | `Item desmarcado` | "João desmarcou "Leite" na lista de compras" |
| Item excluído | `Item removido` | "João removeu "Leite" da lista de compras" |
| Item editado | `Item atualizado` | "João atualizou "Leite" na lista de compras" |
| Itens comprados limpos (lote) | `Lista limpa` | "João removeu 3 itens comprados da lista" |
| Membro removido | `Você saiu da família` | "Você foi removido da família "Casa dos Braga"" |

As notificações usam filtering por tag `familyId` + `userId` (exclusão do autor) e som personalizado (`notification.wav` em `android/app/src/main/res/raw/`).

Ao ser removido de uma família, o app do membro detecta a mudança em tempo real (via `onSnapshot` no próprio documento de membro), remove as tags do OneSignal e cria automaticamente uma nova família própria para o usuário, exibindo um aviso.

### Gamificação

Os pontos são ganhos com base nas **atividades e contribuições** do usuário: ao concluir uma tarefa que lhe foi atribuída, ou ao comprar um item da lista de compras.

- **Tarefas:** o responsável (`assignee`) recebe os `points` definidos na criação da tarefa.
- **Compras:** quem marca o item como comprado recebe `3` pontos fixos por item.
- Os valores são **persistidos** no documento do membro (`points`, `tasksCompleted`, `shoppingCompleted`, `contributions`) e atualizados via `increment()` do Firestore (seguro contra corridas). Reabrir uma tarefa/item **estorna** os pontos.
- O **Ranking Familiar** (`RankingCard`) é alimentado diretamente pelos pontos persistidos de cada membro (identificado por `id`), sem depender de correspondência por nome.

A lógica de crédito/estorno está em [`src/lib/gamification.ts`](./src/lib/gamification.ts) e é acionada em `index.tsx`, `TasksScreen.tsx` e `shoppinglist.tsx`.

### Comemoração

Quando **todas** as tarefas ou itens de compra são concluídos, o app dispara uma animação de confete + badge "Tudo concluído!" e toca `src/assets/audio/celebration.wav` (via `expo-audio`, hook [`src/hooks/useCelebration.tsx`](./src/hooks/useCelebration.tsx)).

---

## Tecnologias

### Frontend (Mobile)

| Tecnologia | Versão | Função |
|---|---|---|
| React Native | 0.86.0 | Framework mobile (New Architecture) |
| Expo | ~57.0.7 | Plataforma de build e desenvolvimento |
| React | 19.2.3 | Biblioteca UI |
| TypeScript | ~6.0.3 | Tipagem estática |
| Expo Router | ~57.0.7 | Roteamento baseado em arquivos |

### Backend

| Tecnologia | Função |
|---|---|
| Firebase Auth | Autenticação (Google Sign-In) |
| Cloud Firestore | Banco de dados NoSQL com persistência offline |
| OneSignal | Notificações push e segmentação por família |

### Bibliotecas Visuais

| Biblioteca | Função |
|---|---|
| React Native Skia | Shaders: Aurora, MeshGradient, ChromaRing |
| React Native SVG | Componente Glow |
| React Native Reanimated | Animações (dock, dialogs, toasts) |
| Expo Linear Gradient | Efeitos de gradiente |
| Expo Blur | Efeitos de desfoque |
| Expo Haptics | Feedback tátil |

### Bibliotecas Funcionais

| Biblioteca | Função |
|---|---|
| @react-native-google-signin/google-signin | Login com Google |
| @react-native-async-storage/async-storage | Persistência local |
| @react-native-community/netinfo | Detecção de conexão |
| react-native-modal | Modais animados |
| @react-native-community/datetimepicker | Seleção de data/hora |
| @react-native-picker/picker | Seletores |
| react-native-onesignal | Notificações push e segmentação |

> **Persistência offline:** o app usa o cache persistente nativo do Firestore
> (`initializeFirestore(app, { localCache: { kind: 'persistent' } })` em
> `lib/firebase.ts`). Leituras e escritas feitas offline são resolvidas
> automaticamente pelo Firestore quando a conexão volta.

> **Tema:** o aplicativo possui **apenas o tema escuro** (definido em
> `constants/Colors.ts` e `userInterfaceStyle: "dark"` no `app.json`). Não há
> alternância entre claro e escuro.

---

## Estrutura do Projeto

```
casaemdia/
├── app.json                          # Configuração Expo
├── eas.json                          # Configuração EAS Build (APK preview / production)
├── .firebaserc                       # Projeto Firebase padrão (deploy de rules)
├── firebase.json                     # Config do Firebase CLI (aponta firestore.rules)
├── firestore.rules                   # Regras de segurança Firestore
├── .env.example                      # Template de variáveis de ambiente
│
└── src/
    ├── app/                          # Rotas (Expo Router)
    │   ├── _layout.tsx               # Layout raiz (providers + Stack)
    │   ├── _settings.tsx             # Tela de Configurações (modal)
    │   ├── AddTaskScreen.tsx         # Tela de Criar Tarefa (modal)
    │   ├── +not-found.tsx            # Página 404
    │   ├── (auth)/
    │   │   └── login.tsx             # Login (Google Sign-In)
    │   └── (tabs)/
    │       ├── _layout.tsx           # Layout das tabs
    │       ├── index.tsx             # Dashboard principal
    │       ├── shoppinglist.tsx      # Lista de Compras
    │       └── TasksScreen.tsx       # Tarefas
    │
    ├── components/
    │   ├── common/                   # Componentes genéricos
    │   │   ├── EmptyState.tsx
    │   │   ├── IconCircleButton.tsx
    │   │   ├── LoadingContainer.tsx
    │   │   ├── PrimaryIconButton.tsx
    │   │   └── SectionTitle.tsx
    │   ├── shared/ui/               # Biblioteca de UI
    │   │   ├── aurora/              # Background Aurora (Skia)
    │   │   ├── chroma-ring/         # ChromaRing Google button
    │   │   ├── dialog/              # AlertDialog + ConfirmDialog
    │   │   ├── glow/                # Efeito Glow (SVG)
    │   │   ├── grainy-gradient/     # Grainy gradient effect
    │   │   ├── mesh-gradient/       # MeshGradient (Skia)
    │   │   ├── reacticx/            # AnimatedChip
    │   │   └── toast/               # Toast notifications
    │   ├── shopping/                # Componentes lista de compras
    │   │   └── ShoppingItemCard.tsx
    │   ├── tasks/                   # Componentes de tarefas
    │   │   ├── AddTaskForm.tsx
    │   │   └── TaskCard.tsx
    │   ├── templates/
    │   │   └── login-background.tsx
    │   ├── DockTabBar.tsx           # Tab bar estilo macOS
    │   ├── Header.tsx               # Header do Dashboard
    │   ├── RankingCard.tsx          # Card de ranking
    │   └── TasksCard.tsx            # Lista de tarefas
    │
    ├── contexts/                     # Contexts React
    │   ├── AuthContext.tsx           # Autenticação
    │   ├── FamilyContext.tsx         # Dados da família
    │   ├── FamilyMembersContext.tsx  # CRUD de membros
    │   └── InvitationContext.tsx     # Sistema de convites
    │
    ├── lib/                          # Serviços
    │   ├── firebase.ts              # Inicialização Firebase
    │   ├── google-auth.ts           # Google Sign-In wrapper
    │   ├── family-migration.ts      # Migração de dados
    │   ├── gamification.ts          # Crédito/estorno de pontos (gamificação)
    │   ├── onesignal.ts             # OneSignal (push notifications)
    │   └── toast.ts                 # Helper do toast
    │
    ├── constants/
    │   └── Colors.ts                # Tokens de cores (dark theme)
    │
    ├── hooks/                        # Custom hooks
    │   ├── useNotificationStatus.ts  # Detecção de chip/notificações
    │   └── useCelebration.tsx        # Animação + som de comemoração
    │
    ├── types/
    │   └── firebase-auth-rn.d.ts
    │
    └── assets/
        ├── audio/
        │   ├── notification.wav       # Som de notificação personalizado
        │   └── celebration.wav        # Som de comemoração (tarefas/compras)
        ├── fonts/
        └── images/
```

---

## Tutorial: Configurando o Firebase

### 1. Criando um Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"**
3. Digite o nome do projeto (ex: `casaemdia-fdbac`)
4. Desative o Google Analytics (opcional) e clique em **"Criar projeto"**
5. Aguarde a criação e clique em **"Continuar"**

### 2. Configurando o App Android

#### 2.1. Registrar o App Android

1. Na tela do projeto, clique no ícone **Android**
2. Preencha:
   - **Nome do app**: `Casa em Dia`
   - **Nome do pacote Android**: `com.joaomjbraga.CasaemDia`
3. Clique em **"Registrar app"**

#### 2.2. Adicionar Impressão Digital (SHA-1)

1. No painel do app Android, role até **"Seu app"**
2. Clique em **"Adicionar impressão digital"**
3. Para obter o SHA-1 do keystore de debug, execute:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
```

4. Copie o valor do **SHA1** e cole no Firebase Console
5. Clique em **"Salvar"**

#### 2.3. Baixar google-services.json

1. Clique em **"Baixar google-services.json"**
2. Coloque o arquivo em `android/app/google-services.json`

### 3. Configurando o Banco de Dados (Firestore)

1. No Firebase Console, clique em **Firestore Database** no menu lateral
2. Clique em **"Criar banco de dados"**
3. Selecione uma localização (ex: `namamerica (east1)` ou mais próxima)
4. Escolha **"Modo de teste"** (permite leitura/escrita temporariamente)
5. Clique em **"Criar"**

### 4. Configurando Google Sign-In

#### 4.1. Criar OAuth Client Web

1. No Firebase Console, vá em ⚙️ **Configurações** → **Geral**
2. Na aba **"Seus apps"**, clique no app Android
3. Role para baixo e copie o **ID do cliente da Web**

#### 4.2. Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=sua-chave-api
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxx
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=000000000000-xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_ONESIGNAL_APP_ID=seu-onesignal-app-id
EXPO_PUBLIC_ONESIGNAL_REST_API_KEY=sua-onesignal-rest-api-key
```

> Todas as variáveis também estão listadas em [`.env.example`](./.env.example).
> Use `cp .env.example .env` para partir do template.

### 5. Configurando as Notificações (OneSignal)

1. Acesse o [OneSignal Dashboard](https://dashboard.onesignal.com) e crie um app
2. Configure a plataforma **Google Android (FCM)** com as credenciais do seu projeto Firebase
3. Copie o **OneSignal App ID** → `EXPO_PUBLIC_ONESIGNAL_APP_ID`
4. Em **Settings → Keys & IDs**, copie a **REST API Key** → `EXPO_PUBLIC_ONESIGNAL_REST_API_KEY`

> **Atenção de segurança:** a `EXPO_PUBLIC_ONESIGNAL_REST_API_KEY` é embutida no
> cliente (prefixo `EXPO_PUBLIC_`). Para produção, o envio de notificações deve
> ser movido para um backend/Cloud Function para não expor a chave REST no app.

O plugin `onesignal-expo-plugin` já está configurado em `app.json` e o som
personalizado (`notification.wav`) é copiado para
`android/app/src/main/res/raw/` durante o `expo prebuild`.

### 6. Configurando o App

#### 6.1. Instalar dependências

```bash
npm install
```

#### 6.2. Gerar diretório Android

```bash
npx expo prebuild --platform android
```

#### 6.3. Configurar Google Services Gradle

Após o prebuild, adicione manualmente ao `android/build.gradle`:

```groovy
dependencies {
    classpath 'com.google.gms:google-services:4.5.0'
}
```

E ao `android/app/build.gradle`:

```groovy
apply plugin: 'com.google.gms.google-services'
```

#### 6.4. Compilar e executar

```bash
npx expo run:android
```

---

## Scripts e Build

### Scripts npm

| Script | Comando | Descrição |
|---|---|---|
| `npm start` | `expo start` | Inicia o servidor de desenvolvimento Metro |
| `npm run android` | `expo run:android` | Compila e executa no Android |

### Build com EAS

O projeto usa [EAS Build](https://docs.expo.dev/build/introduction/) (config em [`eas.json`](./eas.json)):

- **preview** → gera um `.apk` para testes internos
- **production** → build de produção com `autoIncrement` de versão

```bash
# Build de preview (APK)
npx eas build --platform android --profile preview

# Build de produção
npx eas build --platform android --profile production
```

### Deploy das regras do Firestore

O projeto Firebase CLI é configurado em [`.firebaserc`](./.firebaserc) (projeto padrão) e
[`firebase.json`](./firebase.json) (aponta para `firestore.rules`):

```bash
npx firebase-tools deploy --only firestore:rules
```

---

## Instalação Rápida

```bash
# Clone o projeto
git clone https://github.com/joaomjbraga/casaemdia.git
cd casaemdia

# Instale dependências
npm install

# Configure o Firebase (siga o tutorial acima)

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Gere o diretório Android
npx expo prebuild --platform android

# Configure Google Services (siga o passo 6.3)

# Inicie o app
npx expo run:android
```

---

## Solução de Problemas

### Erro DEVELOPER_ERROR (código 10) no Google Sign-In

1. Verifique se o SHA-1 está registrado no Firebase Console
2. Verifique se o package name do app (`com.joaomjbraga.CasaemDia`) confere com o registrado no Firebase
3. Baixe novamente o `google-services.json` após adicionar o SHA-1
4. Faça um build limpo: `rm -rf android && npx expo prebuild --platform android`

### Erro "firebase/invalid-api-key"

Verifique se todas as variáveis de ambiente no `.env` estão corretas.

### App não salva dados offline

O Firestore resolve a persistência offline nativamente (veja `lib/firebase.ts`). Verifique se as regras de segurança estão configuradas corretamente e se o usuário pertence à família cujos dados está tentando acessar.

---

## Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## Créditos

Desenvolvido por **João M J Braga**

## Licença

MIT License
