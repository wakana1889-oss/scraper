export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-xs font-black tracking-widest text-amber-600">
          ABOUT
        </p>

        <h1 className="mt-2 text-3xl font-black">
          このサイトについて
        </h1>

        <div className="mt-8 space-y-8 text-sm leading-8 text-slate-600">
          <section>
            <h2 className="text-lg font-black text-slate-900">
              リラックマのガチャ設置場所まとめとは？
            </h2>

            <p className="mt-2">
              「リラックマのガチャ設置場所まとめ」は、
              リラックマ・コリラックマ・キイロイトリ・チャイロイコグマなどの
              ガチャガチャ設置情報を共有するためのサイトです。
            </p>

            <p className="mt-2">
              地図・店舗・投稿情報をもとに、
              「今どこにありそうか」を探しやすくすることを目的としています。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900">
              目撃情報について
            </h2>

            <p className="mt-2">
              当サイトでは、ユーザーのみなさんからの
              「あった」「なかった」「売り切れ」などの投稿によって、
              最新情報を共有しています。
            </p>

            <p className="mt-2">
              投稿情報はリアルタイム性を重視しており、
              日々更新されます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900">
              ご利用について
            </h2>

            <p className="mt-2">
              当サイトは非公式のファンサイトです。
              商品画像・名称等の権利は各権利所有者に帰属します。
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}