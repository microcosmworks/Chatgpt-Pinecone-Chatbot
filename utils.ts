import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAI } from '@langchain/openai'
import { loadQAStuffChain } from 'langchain/chains'
import { Document } from '@langchain/core/documents'
import { timeout } from './config'
import sbd from 'sbd'

export const queryPineconeVectorStoreAndQueryLLM = async (
  client,
  indexName,
  question
) => {
  // 1. Start query process
  // 2. Retrieve the Pinecone index
  const index = client.index(indexName);

  // 3. Create query embedding
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question)

 // 4. Query Pinecone index and return top 10 matches
 let queryResponse = await index.query({
    topK: 10,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true,
});

  if (queryResponse.matches.length) {

    // 5. Create an OpenAI instance and load the QAStuffChain
    const llm = new OpenAI();

    // 6. loadQAStuffChain is a function that creates a QA chain that uses a language model to generate an answer to a question given some context.
    const chain = loadQAStuffChain(llm);

    // 7. Extract and concatenate page content from matched documents
    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.pageContent)
      .join(" ");
    
    try {

      const result = await chain.invoke({
          input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question: question,
      })

      return result.text
    } catch (error) {
      console.log('error========', error)
    }
  } else {
    console.log('Since there are no matches, GPT-3 will not be queried.');
  }
};

//Pinecone collection
export const createPineconeIndex = async (
  client,
  indexName,
  vectorDimension
) => {
  try {
    // 1. Initiate index existence check
  // 2. Get list of existing indexes
  const existingIndexes = await client.listIndexes();

  const indexExists = existingIndexes.indexes.some(index => index.name === indexName);

  if(indexExists){
    console.log('Index already exist:', indexName)
  }else{
    // Do something, such as create the index
    await client.createIndex({
      name: indexName,
      dimension: vectorDimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-west-2',
        },
      },
    });

    // 5. Wait for index initialization
    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
  } catch (error) {
    console.log('Error:', error)
  }
};

export const updatePinecone = async (client, indexName, scrappedContent) => {

  // 1. Retrieve Pinecone index
  const index = client.index(indexName);

  // 2. Process each document in the scrappedContent
  const text = scrappedContent;

  // Use sbd library to split the text into sentences
  const sentences = sbd.sentences(text);

    // 3. Create RecursiveCharacterTextSplitter instance
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });

    // 4. Split text into chunks (documents)
  const chunks = await textSplitter.createDocuments(sentences);

    console.log(
      `Calling OpenAI's Embedding endpoint for documents with ${chunks.length} text chunks ...`
    );

    // 5. Create OpenAI embeddings for documents
  const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
    chunks.map((chunk) => chunk.pageContent.replace(/\n/g, ' '))
  );

    console.log('Finished embedding documents');
    console.log(
      `Creating ${chunks.length} vectors array with id, values, and metadata...`
    );

    // 6. Create and upsert vectors in batches of 100
    const batchSize = 100;
    let batch: any = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const vector = {
        id: `document_${Date.now()}_${i}`,
        values: embeddingsArrays[i],
        metadata: {
          ...chunk.metadata,
          loc: JSON.stringify(chunk.metadata.loc),
          pageContent: chunk.pageContent,
          txtPath: `document_${Date.now()}_${i}`,
        },
      };

      batch = [...batch, vector];

      // When batch is full or it's the last item, upsert the vectors
      if (batch.length === batchSize || i === chunks.length - 1) {
        await index.upsert(batch)

        // Empty the batch
        batch = [];
      }
    }

    // 7. Log the number of vectors updated
    console.log(`Pinecone index updated with ${chunks.length} vectors for document ${101}`);
  }
