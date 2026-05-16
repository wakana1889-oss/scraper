export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black">
          プライバシーポリシー
        </h1>

        <div className="mt-8 space-y-8 text-sm leading-8 text-slate-600">
          <section>
            <h2 className="text-lg font-black text-slate-900">
              広告について
            </h2>

            <p className="mt-2">
              当サイトでは、第三者配信の広告サービス
              （Google AdSense、Amazonアソシエイト等）を利用する予定です。
            </p>

            <p className="mt-2">
              広告配信事業者は、ユーザーの興味に応じた広告を表示するため、
              Cookieを使用することがあります。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900">
              アクセス解析について
            </h2>

            <p className="mt-2">
              当サイトでは、アクセス解析ツールを利用する場合があります。
              解析にはCookieを利用することがあります。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900">
              目撃情報投稿について
            </h2>

            <p className="mt-2">
              投稿された情報は、サービス改善および設置情報共有のために利用されます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900">
              お問い合わせ
            </h2>

            <p className="mt-2">
              お問い合わせは今後設置予定です。
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}