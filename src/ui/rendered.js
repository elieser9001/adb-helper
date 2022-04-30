document.addEventListener('DOMContentLoaded', async () => {
    const ROOT_DIR = '/sdcard/'
    let currentFileSelected = null

    const loadHtml2Panel = async htmlPage => {
        const loadedHtml = await window.api.loadHTML(htmlPage)
        const div = document.querySelector('#panel')

        if (div.children.length) {
            div.removeChild(div.children[0])
        }

        div.insertAdjacentHTML('beforeend', loadedHtml)
    }

    const showScreenShot = async () => {
        const timestamp = new Date().getTime()
        await window.api.screenshot()

        const imgScreenShotElement = document.querySelector('#screenshot-capture')

        imgScreenShotElement.src = '../../tmp/capture.png?t='+timestamp
    }

    const getDeviceInfo = async () => {
        const deviceInfo = await window.api.getDeviceInfo()
        
        document.querySelector('#device-title').innerText = deviceInfo.device.model
        document.querySelector('#device-timezone').innerText = 'Time Zone: ' + deviceInfo.device.timeZone
        document.querySelector('#wifi-ssid').innerText = 'SSID: ' + deviceInfo.device.wifiSSID
        document.querySelector('#wifi-ip').innerText = 'IP: ' + deviceInfo.device.wifiIp
        
        document.querySelector('#battery-bar').innerHTML = `<div class="bg-green-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: ${deviceInfo.device.batteryLevel}%">${deviceInfo.device.batteryLevel}%</div>`
        
        if (deviceInfo.device.batteryCharging) {
            document.querySelector('#battery-charging').innerHTML = `<div><i class="fa-solid fa-bolt-lightning leading-none h-1 mr-2 text-xl text-yellow-400"></i>Charging</div>`
        }

        const deviceDiskSpacePercent = parseInt(parseInt(deviceInfo.device.diskSpace) / parseInt(deviceInfo.device.diskStorage) * 100)
        
        document.querySelector('#disk-info').innerHTML = `<div class="w-64 h-4 bg-gray-200 rounded-full dark:bg-gray-700">
        <div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: ${deviceDiskSpacePercent}%">${deviceDiskSpacePercent}%</div></div>`
    }

    (async ()=>{
        await loadHtml2Panel('info')
        getDeviceInfo()        
    })()

    document.querySelector('#btn-home').addEventListener('click', async () => {
        await loadHtml2Panel('info')
        getDeviceInfo()
    })

    document.querySelector('#btn-contacts').addEventListener('click', async () => {
        await loadHtml2Panel('contacts')
        const contactsJson = await window.api.getGoogleContacts()

        const contactsListElement = document.querySelector('#contacts-list')
        const contactsCountElement = document.querySelector('#contacts-count')
        contactsCountElement.innerHTML = `(${contactsJson.length})`
        
        let listItems = ''

        contactsJson.map(contact => {
            listItems += `<li class="w-48 border p-2 rounded-lg">
            <div class="bg-gray-600 h-6 mb-2">
            <h4>${contact.name}</i></h4>
            </div>
            <span>+(${contact.number}))</span>
            </li>`
        })

        contactsListElement.insertAdjacentHTML('beforeend', listItems)
    })

    document.querySelector('#btn-screenshot').addEventListener('click', async ()=> {
        await loadHtml2Panel('screenshot')

        document.querySelector('#btn-get-screenshot').addEventListener('click', async () => {
            await showScreenShot()
        })

    })

    const backOneLevelPath = dirPath => {
        let tmpPath = dirPath.split('/')

        if (tmpPath.pop() === '') {
            tmpPath.pop()
        }

        tmpPath = tmpPath.join('/')

        if (tmpPath.length <= 0) {
            tmpPath = '/'
        }

        return tmpPath
    }

    const getInputRemotePath = () => {
        const inputRemotePathElement = document.querySelector('#input-remote-path')

        return inputRemotePathElement
    }

    const getRemoteDir = async dirRemotePath => {
        const fileListElement = document.querySelector('#file-list')
        fileListElement.innerHTML = ''
        const dirJson = await window.api.getJsonDir(dirRemotePath)
        
        let listItems = `<li class="file-item-list mb-2 cursor-pointer  hover:font-bold p-2 hover:bg-blue-100 hover:text-black"><i class="fa-solid fa-folder-open text-yellow-200"></i><span class="ml-2">${dirRemotePath}</span></li>`

        const folderIconStr = `fa-solid fa-folder text-yellow-200`
        const fileIconStr = `fa-solid fa-file text-blue-100`

        dirJson.map(d => {
            listItems += `<li class="file-item-list-${d.fileType.directory === true ? 'folder' : 'file'} mb-2 ml-5 cursor-pointer hover:font-bold hover:bg-blue-100 hover:text-black"><i class="${d.fileType.directory === true ? folderIconStr : fileIconStr}"></i><span class="ml-2">${d.fileName}</span></li>`
        })

        fileListElement.insertAdjacentHTML('beforeend', listItems)

        const inputRemotePathElement = getInputRemotePath()
        inputRemotePathElement.value = dirRemotePath

        document.querySelectorAll('.file-item-list-folder').forEach(el => el.addEventListener('click', async (e) => {
            const inputRemotePathElement = getInputRemotePath()

            if (inputRemotePathElement.value.length) {
                if (inputRemotePathElement.value.split('').pop() !== '/') {
                    inputRemotePathElement.value += '/'
                }

                await getRemoteDir(inputRemotePathElement.value + e.target.innerText)
            }
        }))

        document.querySelectorAll('.file-item-list-file').forEach(el => el.addEventListener('click', async (e) => {
            const inputRemotePathElement = getInputRemotePath()

            currentFileSelected = inputRemotePathElement.value + '/' + e.target.innerText
        })
        )
    }

    document.querySelector('#btn-files').addEventListener('click', async () => {
        await loadHtml2Panel('files')
        await getRemoteDir(ROOT_DIR)

        document.querySelector('#btn-get-remote-path').addEventListener('click', async ()=> {
            const inputRemotePathElement = getInputRemotePath()

            if (inputRemotePathElement.value.length) {
                await getRemoteDir(inputRemotePathElement.value)
            }
        })

        document.querySelector('#btn-back-level-path').addEventListener('click', async ()=>{
            const inputRemotePathElement = getInputRemotePath()

            let dirPath = '/'

            if (inputRemotePathElement.value.length) {
                dirPath = backOneLevelPath(inputRemotePathElement.value)

                if (dirPath.length > 1) {
                    dirPath += '/'
                }
            }

            await getRemoteDir(dirPath)
        })

        document.querySelector('#btn-go-home-path').addEventListener('click', async () => {
            await getRemoteDir(ROOT_DIR)
        })
    })

    const getWhatsAppFiles = async (dirWhatsAppFileFnc, whatsappFileType) => {
        const fileListElement = document.querySelector('#whatsapp-file-list')

        fileListElement.innerHTML = ''
        const filesJson = await dirWhatsAppFileFnc()

        let fileIconStr = ''

        if (whatsappFileType === 'voice') {
            fileIconStr = `fa-solid fa-voicemail`
        } else if (whatsappFileType === 'image') {
            fileIconStr = `fa-solid fa-file-image`
        } else if (whatsappFileType === 'video') {
            fileIconStr = `fa-solid fa-file-video`
        } else if (whatsappFileType === 'statuses') {
            fileIconStr = `fa-solid fa-file`
        }

        let listItems = ''

        if (whatsappFileType === 'voice') {
            filesJson.map(dir => {
                dir.files.map(file=> {
                    listItems += `<li class="mb-2 cursor-pointer hover:font-bold hover:bg-blue-100 hover:text-black">
                    <i class="${ fileIconStr } text-blue-100"></i><span class="ml-2">${file}</span>
                    </li>`
                })
            })
        } else {
            filesJson.map(file => {
                listItems += `<li class="mb-2 cursor-pointer hover:font-bold hover:bg-blue-100 hover:text-black">
                <i class="${ fileIconStr } text-blue-100"></i><span class="ml-2">${file}</span>
                </li>`
            })
        }

        fileListElement.insertAdjacentHTML('beforeend', listItems)
    }

    document.querySelector('#btn-whatsapp').addEventListener('click', async () => {
        await loadHtml2Panel('whatsapp')

        document.querySelector('#btn-whatsapp-voice-notes').addEventListener('click', async () => {
            getWhatsAppFiles(window.api.getWhatsappVoiceNotes, 'voice')
        })

        document.querySelector('#btn-whatsapp-images-sent').addEventListener('click', async () => {
            getWhatsAppFiles(window.api.getWhatsAppImgSent, 'image')
        })

        document.querySelector('#btn-whatsapp-videos-sent').addEventListener('click', async () => {
            getWhatsAppFiles(window.api.getWhatsAppVideoSent, 'video')
        })

        document.querySelector('#btn-whatsapp-images').addEventListener('click', async () => {
            getWhatsAppFiles(window.api.getWhatsAppImages, 'image')
        })

        document.querySelector('#btn-whatsapp-videos').addEventListener('click', async () => {
            getWhatsAppFiles(window.api.getWhatsAppVideos, 'video')
        })
        
        document.querySelector('#btn-whatsapp-statuses').addEventListener('click', async () => {
            getWhatsAppFiles(window.api.getWhatsAppStatuses, 'statuses')
        })
        
    })

    const refreshProcessList = async processListJson => {
        processListJson = processListJson.filter(p=> { return p.user !== 'root' && p.user !== 'system' && p.ppid !== '1' } )

        const processListElement = document.querySelector('#process-list')
        processListElement.innerHTML = ''

        let listItems = ''
        
        processListJson.map(p => {
            listItems += ` <li class="mb-2 cursor-pointer hover:font-bold hover:bg-blue-100 hover:text-black">
            <i class="fa-solid fa-microchip text-blue-100"></i><span class="ml-2">${p.name}</span>
        </li>`
        })

        processListElement.insertAdjacentHTML('beforeend', listItems)
    }
    
    document.querySelector('#btn-process').addEventListener('click', async () => {
        await loadHtml2Panel('process')
        let processListJson =  await window.api.getProcessList()
        await refreshProcessList(processListJson)

        document.querySelector('#update-process-list').addEventListener('click', async () => {
            processListJson =  await window.api.getProcessList()
            await refreshProcessList(processListJson)
        })

        document.querySelector('#btn-filter-process').addEventListener('click', async () => {
            const strToFilter = document.querySelector('#input-text-process').value

            if (strToFilter.length) {
                const processListJson = await window.api.filterProcessName(strToFilter)
                await refreshProcessList(processListJson)
            }
        })
    })

    document.querySelector('#btn-shutdown').addEventListener('click', async () => {
        await loadHtml2Panel('shutdown')

        document.querySelector('#btn-shutdown-now').addEventListener('click', async () => {
            await window.api.shutdown()
        })

        document.querySelector('#btn-reboot-now').addEventListener('click', async () => {
            await window.api.reboot()
        })
    })    
})
