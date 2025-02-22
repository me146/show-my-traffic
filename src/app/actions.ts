'use server'

import { ActionResponse } from "@/type-identifier";
import { translate } from "@vitalets/google-translate-api";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

export const translateData = async (content: string, targetLang: string = 'hi'): Promise<any> => {
  try {
    const { text } = await translate(content, { to: targetLang });
    return (text);
  } catch (error) {
    console.log(error);
    return content;
  }
}

export const generateParaphrase = async (prevState: any, formData: FormData): Promise<ActionResponse<string>> => {
  let content = formData.get("content") as string;
  let locale = formData.get("locale") as string;
  let captcha = formData.get("g-recaptcha-response") as string;
  if (!captcha) {
    return { success: false, errors: { 'captcha': ['Please Check Captcha'] } }
  }
  const totalWords = content?.split(" ")?.length;
  if(totalWords < 50){
    return { success: false, errors: { 'wordLimit': ['Minimum 50 words required'] } }
  } else if(totalWords > 100){
    return { success: false, errors: { 'wordLimit': ['Word limit exceed (Max. 100 words)'] } }
  }
  content = await translateData(content);
  try {
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        {
          role: "user",
          content: `${content} \n  Can you rewrite it with same emotion but different writing in hindi, response must only contain hindi typo`,
        },
      ],
      response_format: { type: 'text' },
    });

    const jsonString = response.choices[0].message.content ?? "";
    return {
      data: await translateData(jsonString, locale),
      success: true,
    };
  } catch (error) {
    return {
      data: "",
      success: false,
    };
  }
}

export const subscribeNewsSettler = async (prevState: any, formData: FormData): Promise<ActionResponse<void>> => {
  await new Promise((resolve, reject) => setTimeout(resolve, 2000));
  return { success: true };
}

export const getArticleBySlug = async (slug: string): Promise<ActionResponse<any>> => {
  try {
    await new Promise((resolve, reject) => setTimeout(resolve, 2000));
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/common/${process.env.NEXT_PUBLIC_SITE_ID}/${slug}`,
      {
        cache:'no-store'
      }
    );
    const responseData = await res.json();
    const { article } = responseData;
    return { success: true, data: article[0] };
  } catch (error) {
    return { success: true, data: null }
  }
}

export const getArticleList = async (type: string): Promise<ActionResponse<any>> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/common/article/${process.env.NEXT_PUBLIC_SITE_ID}/${type}/20`,
      {
        cache:'no-store'
      }
    );
    const responseData = await res.json();

    const { articles = [] } = responseData;
    return { success: true, data: articles };
  } catch (error) {
    console.log({ error });
    return { success: true, data: [] }
  }
}

export async function revalidateRoute(path: string): Promise<void> {
  revalidatePath(path, "layout");
}