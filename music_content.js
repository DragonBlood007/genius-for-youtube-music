/* Variables */

let currentSongTitleInFrame
let songTitleWithoutGeniusLyrics
let userIsOnLyricsTab = false
let lyricsTabIsDisabled = false

const ytmusicTabRendererEl = document.querySelector("#tab-renderer")
let tabsContentEl = document.querySelector("#tabsContent")
let lyricsTabNavEl
let songTitleEl = document.querySelector(".title.ytmusic-player-bar")

/* YT-Music Events */

const songSwitched = () => {
    checkLyricsTabAvailablity()
    songTitleWithoutGeniusLyrics = null
    removeGeniusElements()
    if (userIsOnLyricsTab) {
        YTLyricsSection.setVisibility(true)
        userClickedOnLyricsTab()
    }
}

const userClickedOnNonLyricsTab = () => {
    userIsOnLyricsTab = false
    if (!lyricsTabIsDisabled) {
        geniusFrame.setVisibility(false)
        geniusStatusMessage.setVisibility(false)
        geniusLyricsButton.remove()
        YTLyricsSection.setVisibility(true)
    }
}

const userClickedOnLyricsTab = async () => {
    if (!lyricsTabIsDisabled) userIsOnLyricsTab = true

    let { songArtist, songTitle } = getSongInfo()

    if (!songArtist || !songTitle) {
        geniusStatusMessage.create("Couldn't figure out the song title. 🤔")
        return
    }

    if (songTitle === songTitleWithoutGeniusLyrics) return

    if (
        document.querySelector("#genius-lyrics-frame-wrapper") &&
        songTitle === currentSongTitleInFrame
    ) {
        geniusLyricsButton.remove()
        if (!lyricsTabIsDisabled) YTLyricsSection.setVisibility(false)
        geniusFrame.setVisibility(true)
        return
    }

    removeGeniusElements()

    geniusStatusMessage.create("Searching Genius Lyrics... 🔎")

    let lyricsURL = await getLyricsURL(songArtist, songTitle)

    if (!lyricsURL) {
        songTitleWithoutGeniusLyrics = songTitle
        geniusStatusMessage.setMessage("Couldn't find this song on Genius. 😔")
        return
    }

    currentSongTitleInFrame = songTitle
    geniusStatusMessage.setMessage("Loading Genius Lyrics... ⌛")

    geniusFrame.create(lyricsURL)
}

// Functions

const getSongInfo = () => {
    let songArtistEl =
        document.querySelector(
            "ytmusic-player-bar .middle-controls .content-info-wrapper .byline-wrapper .subtitle .byline .yt-simple-endpoint"
        ) || document.querySelector(".ytmusic-player-bar .byline")
    let songTitleEl = document.querySelector(".title.ytmusic-player-bar")

    if (!songArtistEl || !songTitleEl) {
        return {
            songArtist: null,
            songTitle: null,
        }
    }

    let featureFilterRegex = /(?<=.)[\(\[\{][^\)\]\}]*[\)\]\}]$/

    return {
        songArtist: songArtistEl.innerText,
        songTitle: songTitleEl.innerText.replace(featureFilterRegex, ""),
    }
}

const getLyricsURL = async (songArtist, songTitle) => {
    try {
        let req = await fetch(
            "https://genius.com/api/search/multi?q=" +
                encodeURIComponent(songArtist + " " + songTitle) +
                "&source=yt-music"
        )
        let res = await req.json()

        let topHits = res.response?.sections[0]?.hits
        if (!topHits) return

        let topHit = topHits.find(hit => hit.type === "song")
        if (!topHit) return

        return topHit.result.url + "?source=yt-music"
    } catch (e) {
        return
    }
}

const checkLyricsTabAvailablity = () => {
    if (!lyricsTabNavEl) return
    if (lyricsTabNavEl.hasAttribute("disabled")) {
        lyricsTabIsDisabled = true
        return
    }
    lyricsTabIsDisabled = false
    return
}

const removeGeniusElements = () => {
    geniusFrame.remove()
    geniusStatusMessage.remove()
    geniusLyricsButton.remove()
}

/* Elements */

const geniusFrame = {
    create: lyricsURL => {
        geniusFrame.remove()

        let wrapperEl = document.createElement("div")
        wrapperEl.id = "genius-lyrics-frame-wrapper"
        wrapperEl.style = `
            display: none;
            position: relative;
            width: 100%;
            height: calc(100% - 44px);
            min-height: 200px;
            margin: 14px 0;
            background: rgb(255, 255, 100);
            border-radius: 16px;
        `

        let iFrameEl = document.createElement("iframe")
        iFrameEl.id = "genius-lyrics-frame"
        iFrameEl.src = lyricsURL
        iFrameEl.innerText = "Loading..."
        iFrameEl.style = `
            width: calc(100% - 12px);
            height: calc(100% - 12px);
            margin-top: 6px;
            margin-left: 6px;
            border-radius: 10px;
            box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.16);
        `

        let showYTLyricsButtonEl = YTLyricsButton.create()

        wrapperEl.appendChild(showYTLyricsButtonEl)
        wrapperEl.appendChild(iFrameEl)

        ytmusicTabRendererEl.prepend(wrapperEl)

        iFrameEl.onload = geniusFrame.onLoad
    },
    onLoad: () => {
        geniusStatusMessage.remove()

        if (userIsOnLyricsTab || lyricsTabIsDisabled) {
            geniusFrame.setVisibility(true)
        }
        if (userIsOnLyricsTab) {
            YTLyricsSection.setVisibility(false)
        }
        if (!userIsOnLyricsTab || lyricsTabIsDisabled) {
            YTLyricsSection.setVisibility(true)
        }
    },
    setVisibility: isVisible => {
        let geniusLyricsFrameEl = document.querySelector("#genius-lyrics-frame-wrapper")
        if (!geniusLyricsFrameEl) return
        geniusLyricsFrameEl.style.display = isVisible ? "flex" : "none"
    },
    remove: () => {
        document.querySelectorAll("#genius-lyrics-frame-wrapper").forEach(el => el.remove())
    },
}

const geniusStatusMessage = {
    create: text => {
        geniusStatusMessage.remove()

        let geniusStatusMessageEl = document.createElement("span")
        geniusStatusMessageEl.id = "genius-status-message"
        geniusStatusMessageEl.innerText = text
        geniusStatusMessageEl.style = `
            display: inline-block;
            margin-top: 14px;
            margin-bottom: 12px;
            color: rgb(255, 255, 100);
            background: rgb(255, 255, 100, 0.1);
            border-radius: 16px;
            padding: 12px 18px;
            font-weight: 700;
            font-size: 20px;
            font-family: YouTube Sans;
            line-height: 1.2;
            white-space: nowrap;
        `

        ytmusicTabRendererEl.prepend(geniusStatusMessageEl)

        return geniusStatusMessageEl
    },
    setMessage: text => {
        let statusMessageEl = document.querySelector("#genius-status-message")
        if (!statusMessageEl) {
            geniusStatusMessage.create(text)
            return
        }
        statusMessageEl.innerText = text
    },
    setVisibility: isVisible => {
        let statusMessageEl = document.querySelector("#genius-status-message")
        if (!statusMessageEl) return
        statusMessageEl.style.display = isVisible ? "flex" : "none"
    },
    remove: () => {
        document.querySelectorAll("#genius-status-message").forEach(el => el.remove())
    },
}

const geniusLyricsButton = {
    create: () => {
        geniusLyricsButton.remove()

        let geniusLyricsButtonEl = document.createElement("span")
        geniusLyricsButtonEl.id = "genius-show-genius-lyrics-button"
        geniusLyricsButtonEl.innerText = "Show Genius Lyrics"
        geniusLyricsButtonEl.style = `
            display: inline-block;
            margin-top: 14px;
            margin-bottom: 4px;
            color: black;
            background: rgb(255, 255, 100);
            border-radius: 16px;
            padding: 6px 10px;
            font-weight: 600;
            font-size: 14px;
            font-family: YouTube Sans;
            line-height: 1.2;
            white-space: nowrap;
            cursor: pointer;
        `

        ytmusicTabRendererEl.prepend(geniusLyricsButtonEl)

        geniusLyricsButtonEl.addEventListener("click", geniusLyricsButton.onClick)
    },
    remove: () => {
        document.querySelectorAll("#genius-show-genius-lyrics-button").forEach(el => el.remove())
    },
    onClick: () => {
        YTLyricsSection.setVisibility(false)
        geniusFrame.setVisibility(true)

        geniusLyricsButton.remove()
    },
}

const YTLyricsButton = {
    create: () => {
        let YTLyricsButtonEl = document.createElement("span")
        YTLyricsButtonEl.id = "genius-show-yt-lyrics-button"
        YTLyricsButtonEl.innerText = "Show YT Lyrics"
        YTLyricsButtonEl.style = `
            position: absolute;
            bottom: 12px;
            right: 32px;
            color: black;
            backdrop-filter: blur(2px);
            background: rgb(0, 0, 0, 0.25);
            border-radius: 16px;
            padding: 6px 10px;
            font-weight: 600;
            font-size: 14px;
            font-family: YouTube Sans;
            line-height: 1.2;
            white-space: nowrap;
            cursor: pointer;
        `

        YTLyricsButtonEl.addEventListener("click", YTLyricsButton.onClick)

        return YTLyricsButtonEl
    },
    onClick: () => {
        YTLyricsSection.setVisibility(true)
        geniusFrame.setVisibility(false)

        geniusLyricsButton.create()
    },
}

const YTLyricsSection = {
    setVisibility: isVisible => {
        let oldLyricsSectionEl = document.querySelector(
            "ytmusic-section-list-renderer[page-type] #contents ytmusic-description-shelf-renderer"
        )
        let noLyricsMessageEl = document.querySelector("#tab-renderer ytmusic-message-renderer")

        if (oldLyricsSectionEl) oldLyricsSectionEl.style.display = isVisible ? "block" : "none"
        if (noLyricsMessageEl) noLyricsMessageEl.style.display = isVisible ? "flex" : "none"
    },
}

let lyricsTabNavElFunctionsInitiated = false

const initiateLyricsTabNavElFunctions = () => {
    if (lyricsTabNavElFunctionsInitiated) return
    lyricsTabNavElFunctionsInitiated = true

    lyricsTabNavEl = tabsContentEl.children[2]

    checkLyricsTabAvailablity()
    lyricsTabNavElObserver.observe(lyricsTabNavEl, { attributes: true })

    lyricsTabNavEl.addEventListener("click", () => {
        userClickedOnLyricsTab()
    })
}

/* Observers */

const lyricsTabNavElObserver = new MutationObserver(() => checkLyricsTabAvailablity)

const tabsNavigationObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.attributeName !== "page-type") return
        if (mutation.target.getAttribute("page-type") !== "MUSIC_PAGE_TYPE_TRACK_LYRICS") {
            userClickedOnNonLyricsTab()
            return
        }
        userClickedOnLyricsTab()
    })
})

tabsNavigationObserver.observe(ytmusicTabRendererEl, { attributes: true })

const waitingForLyricsTabObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type !== "childList" && !mutation.addedNodes.length) return
        if (!tabsContentEl.children[2]) return

        waitingForLyricsTabObserver.disconnect()

        initiateLyricsTabNavElFunctions()
    })
})

waitingForLyricsTabObserver.observe(tabsContentEl, {
    characterData: false,
    attributes: false,
    childList: true,
    subtree: false,
})

const songSwitchObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type !== "childList" && !mutation.addedNodes.length) return
        songSwitched()
    })
})

songSwitchObserver.observe(songTitleEl, {
    characterData: false,
    attributes: false,
    childList: true,
    subtree: false,
})

/* Start */

if (ytmusicTabRendererEl.getAttribute("page-type") === "MUSIC_PAGE_TYPE_TRACK_LYRICS") {
    userClickedOnLyricsTab()
}
