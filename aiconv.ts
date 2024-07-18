import {PDFExtract, PDFExtractOptions} from 'pdf.js-extract';

import {CharacterTextSplitter} from '@langchain/textsplitters'

var similarity = require( 'compute-cosine-similarity' );


import OpenAI from "openai"
 
const openai = new OpenAI({
    apiKey : process.env['OPENAI_API_KEY']
})

const text_splitter = new CharacterTextSplitter({separator:" ",chunkSize:2000,chunkOverlap:200})

const pdfExtract = new PDFExtract();
const options: PDFExtractOptions = {}; /* see below */

async function get_pdf_tex(pdf_path:String){
    const data = await    pdfExtract.extract(String(pdf_path), options)
    var text = "";
    data.pages.forEach(element => {
        element.content.forEach(content =>{
            text += content.str
        })
    }); 
    return(text)

}

async function get_text_embedding(text:any) {
    const res = await openai.embeddings.create({model:"text-embedding-3-small",input:text})
    return(res.data[0].embedding)
}

async function get_text_chunks(text:any) {
    const chunk = await text_splitter.splitText(text)
    return chunk
}

async function embed_pdf_text(pdf_path:String) {
    const text = await get_pdf_tex(pdf_path)
    const chunks = await get_text_chunks(text)
    var embeddings : number[] = []

    // console.log(chunks)
    // const temp = await get_text_embedding(chunks[0])
    // console.log(temp)
    for(var i=0;i<chunks.length;i++){
        var temp = await get_text_embedding(chunks[i])
        embeddings.concat(temp)
    }
    return {text_chunks:chunks,text_embeddings:embeddings}
}

async function find_most_relevant_chunks(query_embedding : number[], text_embeddings : number[], text_chunks:string[]){
    const similarities = text_embeddings.map(embedding => similarity(query_embedding, embedding));
        const topIndices = similarities
            .map((similarity, index) => ({ similarity, index }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)
            .map(item => item.index);

            // Get relevant chunks
            const relevantChunks = topIndices.map(index => text_chunks[index]);
            
    
        return(relevantChunks);
}

async function ask_openai_question(question:String, context:String,memory:any[]){
    const messages = [
        {"role": "user", "content": `Context: ${context}\n\nQuestion: ${question}`}
    ]
    const temp = await memory.concat(messages)

    // console.log(temp)
    const res = openai.chat.completions.create({model:"gpt-3.5-turbo",messages:temp})
    return (await res).choices[0].message.content?.toString()
}

async function get_answer_from_pdf(pdf:String,question:String,memory:any[]) {
    const {text_chunks, text_embeddings } = await embed_pdf_text(pdf)
    const query_embedding = await get_text_embedding(question)
    const relevant_chunks = await find_most_relevant_chunks(query_embedding, text_embeddings, text_chunks)
    const context = relevant_chunks.join(" ");
    const answer = await ask_openai_question(question, context,memory)
    
    return answer
}

module.exports = {
    get_answer_from_pdf:get_answer_from_pdf
}