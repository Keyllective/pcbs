const fs = require('fs/promises')
const path = require('path')

const ASSET_ROOT = `https://raw.githubusercontent.com/Keyllective/pcbs/main`

const main = async () => {
  const files = await fs.readdir(path.join(__dirname, '..'))
  const boards = files.filter(file => file.match(/^key-[a-f0-9]{8}$/i))

  const boardsInfo = await Promise.all(boards.map(board => {
    return new Promise(async (resolve) => {
      let info = null

      try {
        const infoStr = await fs.readFile(path.join(__dirname, '..', board, 'board.json'))
        info = JSON.parse(infoStr)
        info.name = board

        const boardDir = await fs.readdir(path.join(__dirname, '..', board), {withFileTypes:true})
        const tagDirs = boardDir
          .filter(dir => dir.isDirectory())
          .map(tag => tag.name)
          .sort((aStr,bStr) => {
            const a = +`1${aStr.replace(/[^0-9]/g,'')}`
            const b = +`1${bStr.replace(/[^0-9]/g,'')}`

            return b-a
          })

        const tags = []

        for (const tag of tagDirs) {
          tags.push({
            name: tag,
            assets: {
              gerbers: `${ASSET_ROOT}/${board}/${tag}/${board}-gerbers-${tag}.zip`,
              bom: `${ASSET_ROOT}/${board}/${tag}/${board}-bom-${tag}.csv`,
              cpl: `${ASSET_ROOT}/${board}/${tag}/${board}-cpl-${tag}.csv`,
            }
          })
        }

        info.tags = tags
      } catch (error) {
        console.log(error)
      }

      resolve(info)
    })
  }))

  const out = JSON.stringify(boardsInfo, null, 2) + '\n'

  await fs.writeFile(path.join(__dirname, '..', 'boards.json'), out)
}

main()
