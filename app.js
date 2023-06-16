const express = require("express");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const app = express();
const port = 5000;

// Google Sheets 인증 정보 설정
const creds = require("./credentials.json");
const doc = new GoogleSpreadsheet(
  "1Uh3mQ6cpM5P0HQ0yhDccLZ3BZhNuosa2tvNyseVRrow"
);
let sheet;

// Google Sheets에 연결하고 시트를 가져오는 함수
async function connectToSpreadsheet() {
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  sheet = doc.sheetsByIndex[0];
  console.log("Google Sheets에 연결되었습니다.");
}

// 클릭 횟수 업데이트 함수
async function updateClickCount() {
  await sheet.loadHeaderRow();
  const headerValues = sheet.headerValues;

  let clickCount = 0;
  let newRow;
  if (headerValues.includes("Click Count")) {
    const rows = await sheet.getRows();
    if (rows.length > 0) {
      newRow = rows[0];
      clickCount = parseInt(newRow["Click Count"]);
    }
  }

  clickCount++;
  const today = new Date().toLocaleString();
  newRow = newRow || (await sheet.addRow({}));
  newRow["Click Count"] = clickCount;
  newRow["Last Updated"] = today;
  await newRow.save();

  console.log(`클릭 횟수: ${clickCount}`);
}

// 정적 파일 제공
app.use(express.static("public"));

// 클릭 이벤트 핸들러
app.get("/increment", (req, res) => {
  updateClickCount()
    .then(() => {
      res.send("클릭 횟수가 업데이트되었습니다.");
    })
    .catch((error) => {
      console.error("클릭 횟수 업데이트 중 오류가 발생했습니다:", error);
      res.status(500).send("클릭 횟수 업데이트 중 오류가 발생했습니다.");
    });
});
app.post("/increment", (req, res) => {
  updateClickCount();
  res.send("Click count updated");
});
// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  connectToSpreadsheet().catch((error) => {
    console.error("Google Sheets 연결 중 오류가 발생했습니다:", error);
  });
});
app.get("/count", (req, res) => {
  sheet
    .loadHeaderRow()
    .then(() => {
      const headerValues = sheet.headerValues;
      let clickCount = 0;
      if (headerValues.includes("Click Count")) {
        const rows = sheet.getRows();
        if (rows.length > 0) {
          const row = rows[0];
          clickCount = parseInt(row["Click Count"]);
        }
      }
      res.send(clickCount.toString());
    })
    .catch((error) => {
      console.error("카운트 숫자 가져오기 중 오류가 발생했습니다:", error);
      res.status(500).send("카운트 숫자 가져오기 중 오류가 발생했습니다.");
    });
});
