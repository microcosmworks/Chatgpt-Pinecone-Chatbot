import { NextResponse, NextRequest } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import cheerio from 'cheerio'
import axios from 'axios'
import {
  createPineconeIndex,
  updatePinecone
} from '../../../utils'
import { indexName } from '../../../config'

export async function POST(req: NextRequest) {

  const body: any = await req.json()

  const blog_array = body.split(',')

  try {
    const responses = await Promise.all(blog_array.map((url) => axios.get(url)));
    const blogContent: any = [];
    
    for (const response of responses) {
      const data = response.data;
      const $ = cheerio.load(data);
      let wordCount = 0;
      
      $('body').find('p').map((_, element) => {
        const content = $(element).text();
        const words = content.split(' ');
        
        if (wordCount + words.length <= 800) {
          blogContent.push(content);
          wordCount += words.length;
        } else {
          return false;
        }
      });
    }

    const filteredContent = blogContent.filter((word) => word.length <= 2500);
    const scrapedContent = JSON.stringify(filteredContent);

  const vectorDimensions = 1536;

  const client = new Pinecone({
    apiKey: `${process.env.PINECONE_API_KEY}`,
  });

    await createPineconeIndex(client, indexName, vectorDimensions);

    // Assuming scrapedContent is an array of strings
    await updatePinecone(client, indexName, scrapedContent);

    return NextResponse.json({
      data: 'Successfully created index and loaded data into Pinecone.'
    });
    
  } catch (error) {
    console.error('Error scraping data:', error);
  }
  
}