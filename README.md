### Up and running

To run the app locally, follow these steps:

1. Clone this repo

```sh
git clone git@github.com:dabit3/semantic-search-nextjs-pinecone-langchain-chatgpt.git
```

2. Change the node version to version 18 or above (nvm use v18.9.1)

Example:

```sh
v18.9.1
```

3. Install the dependencies using either NPM or Yarn (npm install)

4. Please create a .env.local in root
To run this app, you need the following:

   a. An [OpenAI](https://platform.openai.com/) API key

   b. [Pinecone](https://app.pinecone.io/) API Key

```sh
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
PINECONE_API_KEY=YOUR_PINECONE_API_KEY
PINECONE_ENVIRONMENT=YOUR_PINECONE_ENVIRONMENT
```

5. Configure the index name in config.ts

6. Run the app:

```sh
npm run dev
```


# Usage

Enter blog url after that click on the "Create index and embeddings" button

First the using cheerio to scrape the Data from the body 

# Langchain, Pinecone, and GPT with Next.js - Full Stack Starter

This is a basic starter project for building with the following tools and APIs:

- Next.js
- LangchainJS
- Pineceone Vector Database
- GPT3



### What we're building

We are building an app that takes url, embeds them into vectors, stores them into Pinecone, and allows semantic searching of the data.

### Demo video
chatgpt-chatbot-website/demo-video/demo-video-pinecone-chatbot