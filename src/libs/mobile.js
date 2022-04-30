const { exec } = require('child_process')

const ROOT_DIR = '/sdcard/'
const GALLERY_TRASH_PATH = '/storage/emulated/0/Android/.Trash/com.sec.android.gallery3d/'
const CAMERA_TRASH_PATH = '/sdcard/DCIM/Camera/'
const PICTURES_PATH = '/sdcard/Pictures/'
const CAMERA_FILES_PATH = '/sdcard/DCIM/Camera/'
const WHATSAPP_VOICE_NOTES_PATH = '/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Voice Notes/'
const WHATSAPP_STATUSES_PATH = '/sdcard/Android/media/com.whatsapp/WhatsApp/Media/.Statuses/'

const WHATSAPP_IMG_SENT_PATH = '/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Images/Sent/'
const WHATSAPP_VIDEO_SENT_PATH = '/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Video/Sent/'

const WHATSAPP_IMAGES_PATH = '/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Images/Sent/'
const WHATSAPP_VIDEO_PATH = '/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Video/'

const LOCAL_TMP_FOLDER = __dirname + '/../../tmp/'
const LOCAL_WHATSAPP_STATUSES_PATH = LOCAL_TMP_FOLDER + 'statuses/'

const executeCommand = async cmd => {
	return new Promise((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			resolve(stdout)
		})
	})
}

const screenshot = async () => {
	const path = __dirname
	let captureData = await executeCommand(`adb shell screencap -p > ${LOCAL_TMP_FOLDER}capture.png`)
}

const getAllInfo = async () => {
	return await executeCommand('adb shell dumpsys')
}

const unlockScreen = async () => {
	await executeCommand('adb shell input keyevent KEYCODE_POWER')
	await executeCommand('adb shell input keyevent KEYCODE_MENU')
	await executeCommand('adb shell input touchscreen swipe 930 880 930 380')
	await executeCommand('adb shell input tap 500 1450')
}

const getCurrentActivity = async () => {
	const result = await executeCommand("adb shell dumpsys activity a . | grep -E 'ResumedActivity' | cut -d ' ' -f 8")

	return result.trim()
}

const getCurrentPackageName = async () => {
	const currentActivity = await getCurrentActivity()
	let packageName = null

	if (currentActivity.length) {
		packageName = currentActivity.split('/').shift()
		if (packageName.length) {
			return packageName
		}
	}

	return ''
}

const closeApp = async (appPackageName) => {
	const cmd = `adb shell am force-stop ${appPackageName}`

	return await executeCommand(cmd)
}

const closeCurrentActivity = async () => {
	let packageName = await getCurrentPackageName()

	if (packageName.length) {
		await closeApp(packageName)

		return true
	}

	return false
}

const sendClick = async (x, y) => {
	const cmd = `adb shell input tap ${x} ${y}`

	return await executeCommand(cmd)
}

const sendText = async (text) => {
	const formatText = text.replaceAll(' ', '%s')
	const cmd = `adb shell input text '${formatText}'`

	return await executeCommand(cmd)
}

const getNotifications = async () => {
	const cmd = 'adb shell dumpsys notification --noredact | grep tickerText | grep -v null | cut -d= -f2'

	let notifications = await executeCommand(cmd)

	notifications = notifications.split('\n')
	notifications = notifications.filter(notification => { return notification.length > 0 })

	notifications = notifications.map(notification => { return {"title": notification} })

	return notifications
}

const getDir = async (path) => {
	path = path.replaceAll(' ', '\\ ')
	path = `'${path}'`

	return executeCommand(`adb shell ls -la ${path}`)
}

const getMedia = async () => {
	const cmd1 = 'adb shell ls ' + PICTURES_PATH
	const cmd2 = 'adb shell ls ' + CAMERA_FILES_PATH

	const result1 = await executeCommand(cmd1)
	const result2 = await executeCommand(cmd2)

	console.log(result1)
	console.log(result2)
}

const wifi = async (enable) => {
	const cmd = enable ?'adb shell svc wifi enable' : 'adb shell svc wifi disable' 

	return await executeCommand(cmd)
}

const bluetooth = async (enable) => {
	const cmdEnable = 'adb shell settings put global bluetooth_disabled_profiles 1'
	const cmdDisable = 'adb shell settings put global bluetooth_disabled_profiles 0'

	return await executeCommand(cmdEnable)
}

const bluetoothStatus =  async () => {
	const result = await executeCommand('adb shell settings get global bluetooth_on')

	if (result.trim() === '1') {
		return 'enable'
	} else if (result.trim() === '0') {
		return 'disable'
	}

	return null
}

const startCamera = async (imageMode) => {
	await turnScreenOn()
	const cmd = imageMode ? 'adb shell "am start -a android.media.action.IMAGE_CAPTURE"' : 'adb shell "am start -a android.media.action.VIDEO_CAPTURE"'

	return await executeCommand(cmd)
}

const getUserApps = async () => {
	const result = await executeCommand('adb shell pm list packages -3')

	return result.replaceAll('package:', '')
}

const extractPermissions = permissionString => {
  const [_,
       ownerReadPerm,
       ownerWritePerm,
       ownerExecutePerm,
       groupReadPerm,
       groupWritePerm,
       groupExecutePerm,
       othersReadPerm,
       othersWritePerm,
       othersExecutePerm
  ] =  permissionString.split('')

  const result = {
  	owner: {
  		canRead: ownerReadPerm==='r' ? true : false,
  		canWrite: ownerWritePerm==='w' ? true : false,
  		canExecute: ownerExecutePerm==='x' ? true : false
  	},
    group: {
    	canRead: groupReadPerm==='r' ? true : false,
    	canWrite: groupWritePerm==='w' ? true : false,
    	canExecute: groupExecutePerm==='x' ? true : false
    },    
    others: {
    	canRead: othersReadPerm==='r' ? true : false,
    	canWrite: othersWritePerm==='w' ? true : false,
    	canExecute: othersExecutePerm==='x' ? true : false
    }
  }

  return result
}

const dirInfo2Json = dirInfo => {
  const dirArray = dirInfo.split('\n')
  let total = dirArray.shift()
  const filesInfoRaw = dirArray.slice(1, dirInfo.length-1)
  let fileInfoFiltered = []

  total = Number(total.split(' ').pop())

  filesInfoRaw.map(fRaw => {
  	if (fRaw.length > 0) {
	    const fileInfo = fRaw.split(' ').filter(item => {
	      return item != ''
	    })

	    const [permissions, numberFiles, currentOwner, owner, groupId, dateModified, timeModified, fileName] = fileInfo

	    if (fileName !== '.' && fileName !== '..') {
	      let fileType = permissions.split('').shift()

	      fileType = fileType === 'd' ? {directory: true} : {directory: false}

	      fileInfoFiltered.push(
		      {
		      	fileType,
		      	permissions: extractPermissions(permissions),
		      	numberFiles,
		      	currentOwner,
		      	owner,
		      	groupId,
		      	dateModified,
		      	timeModified,
		      	fileName
		      }
	      )
	    }
    }
  })

  return fileInfoFiltered
}

const getRootDir = async () => {
	const dirData = await getDir(ROOT_DIR)

	return dirInfo2Json(dirData)
}

const processInfo = async () => {
	return await executeCommand('adb shell ps')
}

const processInfo2Json = (processData) => {
  let processRows = []

  processData.split('\n').map(processData => {
    processRows.push(processData.split(' ').filter(column => { return column !='' }))
  })

  const columnsName = processRows.shift().map(cn => { return cn.toLowerCase() })
  let arrayProcess = []

  processRows.map(pRow=>{
  	let objProcess = {}

    if (pRow.length) {
      for (var i = 0; i < columnsName.length; i++) {
        objProcess[columnsName[i]] = pRow[i]
      }

      arrayProcess.push(objProcess)
    }
  })
  
  return arrayProcess
}

const killProcess = async packageName => {
	return await executeCommand(`adb shell am force-stop ${packageName}`)
}

const getTrashFiles = async () => {
	const cmd1 = 'adb shell ls -la ' + GALLERY_TRASH_PATH
	const cmd2 = 'adb shell ls -la ' + CAMERA_TRASH_PATH

	const filesInfoGalleryTrash = await executeCommand(cmd1)
	const filesCameraTrash = await executeCommand(cmd2)

	let filesJsonGalleryTrash = dirInfo2Json(filesInfoGalleryTrash)
	let filesJsonCameraTrash = dirInfo2Json(filesCameraTrash)
	
	filesJsonGalleryTrash = filesJsonGalleryTrash.map(fGalleryTrash => {
		return {...fGalleryTrash, fileName: GALLERY_TRASH_PATH + fGalleryTrash.fileName} 
	})

	filesJsonCameraTrash = filesJsonCameraTrash.map(fCameraTrash => { return {...fCameraTrash, fileName: CAMERA_TRASH_PATH + fCameraTrash.fileName} })


	filesJsonCameraTrash = filesJsonCameraTrash.filter(fCameraTrash => { return fCameraTrash.fileName.indexOf('.trashed') > -1})

	
	return filesJsonGalleryTrash.concat(filesJsonCameraTrash)
}

const downloadFile = async (remoteFilePath, localPath) => {
	remoteFilePath = `'${remoteFilePath}'`
	
	localPath = localPath.replaceAll(' ', '\\ ')
	localPath = `'${localPath}'`
	
	return await executeCommand(`adb pull ${remoteFilePath} ${localPath}`)
}

const fixDirPath = dirPath => {
	if (dirPath.split('').pop() !== '/') {
		dirPath += '/'
	}

	return dirPath
}

const downloadAllFilesFromDir = async (dirPath, localPath) => {
	dirPath = fixDirPath(dirPath)

	const dirInfo = await getDir(dirPath)
	const dirJson = await dirInfo2Json(dirInfo)

	dirJson.map(async file => { console.log(await downloadFile(dirPath + file.fileName, localPath)) })
}

const createDir = async fullDirPath => {
	return await executeCommand(`adb shell mkdir -p ${fullDirPath}`)
}

const whatsappVoiceInfo2Json = whatsappVoiceInfo => {
	let wVoiceNotesInfo = whatsappVoiceInfo.split(WHATSAPP_VOICE_NOTES_PATH).filter(d => {
		return (d.length > 15 && d.indexOf('.opus')>-1)
	})

	let wVoiceNotes = []

	wVoiceNotesInfo.map(wVoiceNote => {
	  const wVoiceNoteFolder = wVoiceNote.split(':').shift()
	  const wVoiceNoteAudios = wVoiceNote.split(':').pop().split('\n').filter(vn => { return vn })
 
	  wVoiceNotes.push({"path": WHATSAPP_VOICE_NOTES_PATH + wVoiceNoteFolder + '/', "files": wVoiceNoteAudios})
	})

	return wVoiceNotes
}

const getWhatsAppFiles = async (whatsappFilesPath) => {
	let path = whatsappFilesPath

	path = path.replaceAll(' ', '\\ ')
	path = `'${path}'`

	const cmd = `adb shell ls -p ${path} | egrep -v /$`
	const whatsappFilesInfo = await executeCommand(cmd)
	
	return whatsappFilesInfo.trim().split('\n')
}

const getWhatsappVoiceNotes = async () => {
	let path = WHATSAPP_VOICE_NOTES_PATH

	path = path.replaceAll(' ', '\\ ')
	path = `'${path}'`

	const cmd = 'adb shell ls -R ' + path
	const whatsappVoiceInfo = await executeCommand(cmd)

	return whatsappVoiceInfo2Json(whatsappVoiceInfo)
}

const openUrl = async (url) => {
	return await executeCommand(`adb shell am start -a android.intent.action.VIEW -d ${url}`)
}

const isScreenOn = async () => {
	const result = await executeCommand('adb shell dumpsys input_method | grep -c "mInteractive=true"')

	if (result.trim().toString() === '1') {
		return true
	} else {
		return false
	}
}

const turnScreenOn = async () => {
	const screenAlreadyOn = await isScreenOn()

	if (!screenAlreadyOn) {
		await executeCommand('adb shell input keyevent KEYCODE_WAKEUP')
		await executeCommand('adb shell input touchscreen swipe 530 1420 530 1120')
	}
}

const turnScreenOff = async () => {
	const screenAlreadyOn = await isScreenOn()

	if (screenAlreadyOn) {
		return await executeCommand('adb shell input keyevent KEYCODE_POWER')
	}
}

const uninstallApp = async (packageName) => {
	return await executeCommand(`adb uninstall --user 0 ${packageName}`)
}

const getBatteryLevel = async () => {
	const batteryInfo = await executeCommand('adb shell dumpsys battery')
	
	const result = batteryInfo.match(/level: (.*?)\n/)

	if (result.length) {
		return parseInt(result[1])
	}

	return 0
}

const getGoogleContacts = async () => {
	const contactsInfo = await executeCommand('adb shell content query --uri content://contacts/phones/  --projection display_name:number:notes')

	let contactsJson = []

	const filteredContactsInfo = contactsInfo.split('\n').filter(d=>{return d.length})
	filteredContactsInfo.map(contact => {
		const name = contact.match(/display_name=(.*?),/)[1]
	  const number = contact.match(/number=(.*?),/)[1]
	  
		contactsJson.push({name, number})
	})


	return contactsJson
}

const getWifiIp = async () => {
	const result = await executeCommand(`adb shell ip addr show wlan0 | grep 'inet ' | cut -d ' ' -f 6 | cut -d / -f 1`)

	return result.trim()
}

const showWhatsAppStatuses = async () => {
	await downloadAllFilesFromDir(WHATSAPP_STATUSES_PATH, LOCAL_WHATSAPP_STATUSES_PATH)
}

const getWifiSSID = async () => {
	const result = await executeCommand('adb shell dumpsys wifi')

	return result.match(/SSID\:\s(.+?)\sBSSID\:/)[1].replace(',', '')
}

const getTotalStorageGB = async () => {
	const diskInfo = await executeCommand('adb shell dumpsys mount')
	const result = diskInfo.match(/total size: (.*?)\s/)

	if (result.length) {
		return parseInt(result[1]/1000000000)
	}

	return 0
}

const reboot = async () => {
	return await executeCommand('adb reboot')
}

const shutdown = async () => {
	return await executeCommand('adb shell reboot -p')	
}

const getDiskFreeSpaceGB = async () => {
	let diskInfo = await executeCommand(`adb shell df -h /sdcard`)

	diskInfo = diskInfo.trim().split('\n').pop().split(' ').filter(
		d => {
			return d.length 
		})[3].replace('G','')

	return diskInfo
}

const isBatteryCharging = async () => {
	const batteryInfo = await executeCommand('adb shell dumpsys battery')
	const result1 = batteryInfo.match(/AC powered: (.*?)\n/)
	const result2 = batteryInfo.match(/USB powered: (.*?)\n/)


	if ((result1 && result1[1] === 'true') || (result2 && result2[1] === 'true')) {
	  return true
	}

	return false
}

const downloadTrashFromJson = async (trashFilesJson, localPath) => {
	localPath = fixDirPath(localPath)

	trashFilesJson.map(async tfj => {
		console.log(await executeCommand(`adb pull ${tfj.fileName} ${localPath}`))
	})
}

const getJsonDir = async dirPath => {
	const dirInfo = await getDir(dirPath)

	return await dirInfo2Json(dirInfo)
}

const getWhatsAppImgSent = async () => {
	return getWhatsAppFiles(WHATSAPP_IMG_SENT_PATH)
}

const getWhatsAppVideoSent = async () => {
	return getWhatsAppFiles(WHATSAPP_VIDEO_SENT_PATH)
}

const getWhatsAppImages = async () => {
	return getWhatsAppFiles(WHATSAPP_IMAGES_PATH)
}

const getWhatsAppVideos = async () => {
	return getWhatsAppFiles(WHATSAPP_VIDEO_PATH)
}

const getWhatsAppStatuses = async () => {
	return getWhatsAppFiles(WHATSAPP_STATUSES_PATH)
}

const getProcessList = async () => {
	const processData = await processInfo()

	return await processInfo2Json(processData)
}

const filterProcessName = async processName => {
	const processData = await processInfo()
	const processJson = await getProcessList()

	return processJson.filter(p => { return p.name.indexOf(processName) > -1 })
}

const capitalize = word => {
	return word[0].toUpperCase() + word.slice(1)
}

const getTimeZone = async () => {
	let result = await executeCommand('adb shell getprop persist.sys.timezone')

	return result.trim()
}

const getDeviceModel = async () => {
	const result = await executeCommand('adb shell getprop ro.bootimage.build.fingerprint')

	const dSplit = result.trim().split('/')
	const deviceName = dSplit[0]
	const deviceModel = dSplit[1]

	return capitalize(deviceName) + ' ' + capitalize(deviceModel)
}

const getDeviceType = async () => {
	let result = await await executeCommand('adb shell getprop ro.build.characteristics')

	return result.trim()
}

const getDeviceInfo = async () => {
	let deviceModel = await getDeviceModel()
	let deviceType = await getDeviceType()
	const deviceTimeZone = await getTimeZone()
	const deviceWifiIp =  await getWifiIp()
	const deviceWifiSSID = await getWifiSSID()


	deviceType = deviceType[0].toUpperCase() + deviceType.slice(1)
	deviceModel = capitalize(deviceModel) + ' (' + deviceType + ')'

	const deviceDiskSpace = await getDiskFreeSpaceGB()
	const deviceStorageTotal = await getTotalStorageGB()
	const batteryLevel = await getBatteryLevel()
	const batteryCharging = await isBatteryCharging()

	return {
		"device": {
			"model": deviceModel,
			"timeZone": deviceTimeZone,
			"wifiSSID": deviceWifiSSID,
			"wifiIp": deviceWifiIp,
			"diskSpace": deviceDiskSpace,
			"diskStorage": deviceStorageTotal,
			"batteryLevel": batteryLevel,
			"batteryCharging": batteryCharging
		}
	}
}

module.exports = {
	getBatteryLevel,
	getAllInfo,
	getDir,
	getGoogleContacts,
	screenshot,
	getRootDir,
	getJsonDir,
	getWhatsappVoiceNotes,
	getWhatsAppImgSent,
	getProcessList,
	filterProcessName,
	sendClick,
	getDeviceInfo,
	getWhatsAppVideoSent,
	getWhatsAppImages,
	getWhatsAppVideos,
	getWhatsAppStatuses,
	shutdown,
	reboot
}
