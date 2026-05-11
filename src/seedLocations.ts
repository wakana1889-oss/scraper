import { supabase } from "./db"

async function run() {
  console.log("start seed locations")

  const locations = [
    {
      name: "ガシャポンのデパート 池袋総本店",
      address: "東京都豊島区東池袋3-1-3 サンシャインシティ ワールドインポートマートビル3F",
      prefecture: "東京都",
      city: "豊島区",
      latitude: 35.7295,
      longitude: 139.7183,
      source_url: "manual",
    },
    {
      name: "ガシャポンのデパート 秋葉原店",
      address: "東京都千代田区外神田1-15-9 namco秋葉原店4F",
      prefecture: "東京都",
      city: "千代田区",
      latitude: 35.6984,
      longitude: 139.7730,
      source_url: "manual",
    },
    {
      name: "ガシャポンのデパート 東京ソラマチ店",
      address: "東京都墨田区押上1-1-2 東京スカイツリータウン・ソラマチ4F イーストヤード",
      prefecture: "東京都",
      city: "墨田区",
      latitude: 35.7101,
      longitude: 139.8107,
      source_url: "manual",
    },
    {
      name: "ガシャポンのデパート イトーヨーカドー大井町店",
      address: "東京都品川区大井1-3-6 イトーヨーカドー大井町店",
      prefecture: "東京都",
      city: "品川区",
      latitude: 35.6076,
      longitude: 139.7348,
      source_url: "manual",
    },
    {
      name: "ガシャポンのデパート イトーヨーカドーアリオ北砂店",
      address: "東京都江東区北砂2-17-1 アリオ北砂",
      prefecture: "東京都",
      city: "江東区",
      latitude: 35.6825,
      longitude: 139.8250,
      source_url: "manual",
    },
    {
      name: "ガシャポンのデパート オリオン書房ノルテ店",
      address: "東京都立川市曙町2-42-1 パークアベニュー3F",
      prefecture: "東京都",
      city: "立川市",
      latitude: 35.7013,
      longitude: 139.4137,
      source_url: "manual",
    },
    {
      name: "本屋さんのガシャポンのデパート リブロ福生店",
      address: "東京都福生市東町5-1 西友福生店パート2 1F",
      prefecture: "東京都",
      city: "福生市",
      latitude: 35.7420,
      longitude: 139.3277,
      source_url: "manual",
    },
    {
      name: "ガシャポンのデパート プレナ幕張店",
      address: "千葉県千葉市美浜区ひび野2-4 プレナ幕張2F",
      prefecture: "千葉県",
      city: "千葉市美浜区",
      latitude: 35.6483,
      longitude: 140.0421,
      source_url: "manual",
    },
    {
      name: "ガシャポンのデパート 松戸店",
      address: "千葉県松戸市松戸1230-1 ピアザ松戸1F",
      prefecture: "千葉県",
      city: "松戸市",
      latitude: 35.7845,
      longitude: 139.9006,
      source_url: "manual",
    },
    {
      name: "ガシャポンのデパート 流山おおたかの森S・C店",
      address: "千葉県流山市おおたかの森南1-5-1 流山おおたかの森S・C 3F",
      prefecture: "千葉県",
      city: "流山市",
      latitude: 35.8711,
      longitude: 139.9250,
      source_url: "manual",
    }
  ]

  const { error } = await supabase
    .from("locations")
    .upsert(locations, {
      onConflict: "name,address",
    })

  if (error) {
    console.error("LOCATION UPSERT ERROR:", error)
    return
  }

  console.log("locations inserted:", locations.length)
}

run()
