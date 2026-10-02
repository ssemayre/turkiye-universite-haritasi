

async function test() {
  const uniName = "Boğaziçi Üniversitesi";
  const searchRes = await fetch(`https://tr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(uniName)}&utf8=&format=json`);
  const searchData = await searchRes.json();
  const title = searchData.query.search[0].title;
  console.log("Title:", title);

  const detailRes = await fetch(`https://tr.wikipedia.org/w/api.php?action=query&prop=extracts|pageprops&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json`);
  const detailData = await detailRes.json();
  const pages = detailData.query.pages;
  const pageId = Object.keys(pages)[0];
  const page = pages[pageId];
  
  console.log("Extract:", page.extract.substring(0, 100));
  const wikidataId = page.pageprops.wikibase_item;
  console.log("Wikidata ID:", wikidataId);

  if (wikidataId) {
    const wikiRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikidataId}&property=P856&format=json`);
    const wikiData = await wikiRes.json();
    const claims = wikiData.claims.P856;
    if (claims && claims.length > 0) {
      const website = claims[0].mainsnak.datavalue.value;
      console.log("Website:", website);
    }
  }
}
test();
