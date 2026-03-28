const fs = require('fs')
const path = require('path')

const asarPath = path.join(__dirname, '../dist/mac-arm64/hollywood.app/Contents/Resources/app.asar')
if (fs.existsSync(asarPath)) {
  fs.rmSync(asarPath, { force: true })
}
