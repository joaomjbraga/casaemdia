# Setup local de desenvolvimento

Passos mínimos para rodar o projeto localmente (Android / Expo):

1. Instale dependências (Node.js 20+)

```bash
npm install
```

2. Copie o arquivo de ambiente e preencha as variáveis (use o `EXPO_PUBLIC_*`):

```bash
cp .env.example .env
# preencher .env com as chaves do Google, OneSignal e Cloudinary
```

Variáveis exigidas (exemplos):

- EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
- EXPO_PUBLIC_ONESIGNAL_APP_ID
- EXPO_PUBLIC_API_URL
- EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
- EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET

3. (Android) Gere o build nativo e execute no emulador:

```bash
npx expo prebuild --platform android
npx expo run:android
```

4. Verificações úteis:

```bash
# checar tipagem
npx tsc --noEmit

# iniciar em desenvolvimento (Expo)
npm start
```

Notas:

- Para Google Sign-In no Android, adicione o SHA-1 do keystore no console do Firebase e baixe o `google-services.json`.
- Proteja chaves sensíveis usando secrets no CI (não commitá-las).
- A `ONESIGNAL_REST_API_KEY` pertence ao **backend** (`casaemdia-api/.env`), nunca ao app: colocá-la em `EXPO_PUBLIC_*` expõe a credencial no binário/cliente.

## Lint e formatação

O projeto usa ESLint + Prettier. Instale as dependências de desenvolvimento:

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-react eslint-plugin-react-native prettier eslint-plugin-import
```

Após instalar, rode:

```bash
npm run lint      # verifica problemas
npm run lint:fix  # tenta corrigir automaticamente
npm run format    # aplica Prettier
```
