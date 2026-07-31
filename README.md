![banner](./.github/casaemdia.jpg)

# Casa em Dia

Casa em Dia é um aplicativo mobile para organização doméstica, criado com React Native e Expo. O projeto concentra tarefas, lista de compras, convites de família e notificações em uma experiência colaborativa para o dia a dia.

## O que o app faz

- Login com Google (ID token verificado pelo backend)
- Gestão de famílias compartilhadas com convites por e-mail
- Tarefas com responsáveis
- Lista de compras colaborativa
- Notificações push via OneSignal
- Tema claro estilo iOS com visual minimalista
- Navegação e componentes reestilizados para maior clareza e consistência
- Cores unificadas e superfícies mais limpas
- Correções de bugs e inconsistências no tema e tipos
- Dados sincronizados em tempo real com o backend via HTTP + WebSocket

## Arquitetura atual

A base do projeto foi reorganizada para separar responsabilidades entre:

- Rotas e telas em src/app
- Contextos para autenticação, família, membros e convites em src/contexts
- Serviços com a lógica de domínio em src/services, como:
  - family.ts
  - tasks.ts
  - shopping.ts
  - family-members.ts
  - account.ts
- Helpers e integrações em src/lib, incluindo OneSignal e autenticação Google

Essa estrutura ajuda a manter as telas mais enxutas e centraliza as regras de negócio em pontos mais fáceis de manter.

## Requisitos

- Node.js 20+ (22 recomendado para CI)
- npm
- Android Studio e um emulador ou dispositivo Android
- Client IDs OAuth do Google (Android/iOS) criados no Google Cloud Console
- Conta OneSignal para notificações push

## Configuração rápida

1. Clone o repositório
2. Copie o arquivo de exemplo de variáveis de ambiente:

```bash
cp .env.example .env
```

3. Preencha as variáveis no arquivo .env com as credenciais do Google, OneSignal e Cloudinary.

4. Instale as dependências:

```bash
npm install
```

5. Gere o projeto Android (se necessário):

```bash
npx expo prebuild --platform android
```

6. Execute o app:

```bash
npm run android
```

## Variáveis de ambiente

As variáveis esperadas são:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_ONESIGNAL_APP_ID=
EXPO_PUBLIC_API_URL=http://192.168.0.103:3333
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

O template completo está em [.env.example](./.env.example).

**Observação sobre o Backend (Node/Express)**

O backend Node/Express usa variáveis adicionais que não devem ser expostas ao cliente. Elas devem ser definidas no ambiente do servidor (por exemplo em um arquivo `.env` no diretório `server/` ou nas configurações do seu provedor):

```env
JWT_SECRET=change-me-super-secret
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_CLIENT_ID=
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
```

Certifique-se de preencher essas variáveis no ambiente do servidor antes de iniciar `server`. A `ONESIGNAL_REST_API_KEY` **não deve** estar no app: ela é uma credencial de servidor e vazaria segredos se embarcada no cliente.

## Autenticação e dados

O app não usa Firebase. O login é feito com o Google Sign-In nativo (`@react-native-google-signin`), que entrega um ID token enviado ao backend para emissão de um JWT próprio.

Resumo do fluxo principal:

- O primeiro login cria a família do usuário, quando necessário
- O administrador pode convidar membros por e-mail
- O convite é aceito pelo destinatário e o membro entra na família
- As operações principais de tarefas, compras e convites são persistidas no banco do backend

## Notificações push

O app registra o dispositivo no OneSignal e envia tags (`familyId`, `userId`, `userEmail`) ao entrar numa família. O **envio** das notificações é feito pelo backend (Node/Express) via `NotificationService`, que usa a `ONESIGNAL_REST_API_KEY` apenas no servidor — nunca no app. O fluxo cobre eventos como criação de tarefas, conclusão, reabertura, remoção e atualização de itens da lista de compras.

## Scripts

```bash
npm start
npm run android
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run typecheck
```

## Validação

Use o TypeScript para validar tipos sem output:

```bash
npm run typecheck
```

Verifique formatação e lint antes de commitar:

```bash
npm run format:check
npm run lint
```

Para aplicar correções automáticas:

```bash
npm run format
npm run lint:fix
```

## Integração contínua (CI)

O repositório roda um workflow GitHub Actions em `push` e `pull_request` para as branches `main` e `master`.

Ele realiza as seguintes etapas:

- instala dependências com `npm ci`
- executa `npm run format:check`
- executa `npm run lint`
- executa `npx tsc --noEmit`

Se qualquer etapa falhar, o resultado do `tsc` é armazenado como artefato de build.

## Estrutura do projeto

```text
casaemdia/
├── app.json
├── eas.json
├── .env.example
└── src/
    ├── app/
    ├── components/
    ├── contexts/
    ├── hooks/
    ├── lib/
    ├── services/
    ├── types/
    └── assets/
```

## Solução de problemas

### Google Sign-In com erro DEVELOPER_ERROR

- Verifique se o SHA-1 do keystore foi registrado no client OAuth Android no Google Cloud Console
- Confirme se o package name do app corresponde ao cadastrado
- Baixe novamente o `google-services.json` após ajustar a configuração

### Erro "no registered origin"

- O client OAuth Web precisa das origens cadastradas em *Authorized JavaScript origins*
- Apps nativos (Android/iOS) exigem client OAuth próprios, criados com o package/bundle ID do app
- Reinicie o Metro/Expo após alterar o ambiente

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para a mudança
3. Envie o pull request com uma descrição clara

## Licença

MIT License
