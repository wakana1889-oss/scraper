import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateReport(text: string) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "あなたは商品紹介ライターです"
      },
      {
        role: "user",
        content: `
以下の情報から短い記事を作ってください。

・タイトル（キャッチーに）
・要約（2〜3行）

${text}
        `
      }
    ]
  })

  return res.choices[0].message.content
}