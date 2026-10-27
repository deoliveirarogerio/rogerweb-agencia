# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Rastreamento de conversões pelo Google Tag Manager

O site envia eventos personalizados ao `dataLayer` existente. Esses eventos só são enviados depois que o visitante aceita os cookies; dados de formulário, texto digitado e URLs de WhatsApp com mensagem nunca são incluídos.

| Evento | Quando é enviado | Parâmetros |
| --- | --- | --- |
| `contact_cta_click` | Clique em um link para a seção ou página de contato | `event_source` |
| `whatsapp_click` | Clique em um link do WhatsApp ou escolha do WhatsApp após falha do formulário | `event_source` |
| `email_click` | Clique em um link de e-mail | `event_source` |
| `phone_click` | Clique em um link de telefone | `event_source` |
| `generate_lead` | Formulário de contato enviado com sucesso | `form_id` |

Para registrar esses eventos no GA4, crie no GTM um acionador **Evento personalizado** para cada nome e associe uma tag **Evento do GA4** usando a configuração Google/GA4 já existente no contêiner. Marque `generate_lead` como evento principal (conversão) no GA4. Não crie outra tag de configuração do Google nem um segundo `page_view`, para evitar duplicidade.
