/*
* Requirements:
* - Linkedin premium account
* - console usage know-how
*
*/

const lessonSections = document.querySelectorAll('.classroom-toc-section');

const sections = []

const courses = []

let courseVideos = []

let brokenIframes = []

let cancelRetry = false

function retryCancel() {
    if (cancelRetry) {
        return
    }
    cancelRetry = true
    console.log('%c Vamp mode: retry canceled', 'background: orange; color: white;')
}

lessonSections.forEach((element,sectionIndex) => {

    sectionIndexFormatted = `${sectionIndex}`.padStart(2, '0')

    if (!sections.find(section => section.sectionIndex === sectionIndexFormatted)) {
        sections.push({
            sectionIndex: sectionIndexFormatted,
            courses: []
        })
    }

    const courseItems = element.querySelectorAll('.classroom-toc-item__link')
    
    for (let [courseIndex, item] of courseItems.entries()) {

        let courseTitle = item.querySelector('.classroom-toc-item__title').textContent

        courseTitle = formatCourseTitle(courseTitle)

        const courseIndexFormatted = `${courseIndex}`.padStart(2, '0')

        const link = item.getAttribute('href').replace('autoplay=true','autoplay=false')

        courses.push({
            fullId: `${sectionIndexFormatted}_${courseIndexFormatted}`,
            link,
            videoNameAfterDownload: `${sectionIndexFormatted}_${courseIndexFormatted}_${courseTitle}`,
            videoLink: ''
        })
    }
});

function formatCourseTitle (title) {
    const toUnderScoreChars = [':', ' ', ',']
    const nonGrataWordValues = ['(Görüntülendi)', '(Devam ediyor)', '(Viewed)', '(In progress)']

    let formattedTitle = title

    for (let word of nonGrataWordValues) {
        formattedTitle = formattedTitle.replaceAll(word, '')
    }

    for (let char of toUnderScoreChars) {
        formattedTitle = formattedTitle.replaceAll(char, '_')
    }

    formattedTitle = formattedTitle.replaceAll(/\s/g, '_')
    formattedTitle = formattedTitle.replaceAll(/\r\n|\r|\n/g, '_')
    formattedTitle = formattedTitle.match(/([A-Za-z0-9]+(_[A-Za-z0-9]+)+|[A-Za-z0-9]+)/)[0]
    formattedTitle = formattedTitle.toLowerCase()

    return formattedTitle
}

function addVideoUrls() {
    for (const iframeId of courseVideos) {
        const courseIframe = document.querySelector(`iframe[data-course-id="${iframeId}"]`)
        let videoUrl = courseIframe.contentWindow.document.querySelector('video')
        
        if (videoUrl) {
            videoUrl = videoUrl.getAttribute('src')
            const course = courses.find(course => course.fullId === iframeId)
    
            course.videoLink = videoUrl
        } else {
            brokenIframes.push(iframeId)
        }
    }

    if (brokenIframes.length === 0) {
        console.log("Vamp mode: Download links ready. Starting renamed href links.")

        createDownloadLinksElement()

        return
    }
        
    courseVideos = courseVideos.filter(courseId => {return brokenIframes.includes(courseId)})

    console.log(`%cVamp mode: Got broken urls. Retrying in 10 seconds. Call 'retryCancel()' to disable retry`, 'background:red; color: white; padding: 5px 10px;')

    if (!cancelRetry) {
        setTimeout(function () { 
            brokenIframes = []
            addVideoUrls()
        }, 10000)
    }    
}

function* generateIframes () {
    for (const [index, course] of courses.entries()) {
        const courseIframe = document.createElement('iframe')

        courseIframe.src = course.link
        courseIframe.setAttribute('data-course-id', course.fullId)
        //for debugging
        //courseIframe.style = 'width: 300px; height: 300px;'

        courseIframe.style = 'width: 0px; height: 0px;'

        courseIframe.onload = function() {
            courseVideos.push(course.fullId)

            if (courseVideos.length === courses.length) {
                addVideoUrls()
            }

            vampIframes.next()
        }
        
        vampBody.appendChild(courseIframe)

        console.log(`%cVamp mode: ${Math.floor((100 / courses.length) * (index + 1))}% percent done.`, 'background: green; color: white;')
        
        yield courseIframe
    }
}

function createDownloadLinksElement () {

    const createContainerElement = () => {
        const containerElement = document.createElement('div')
        containerElement.style = 'display: flex;'

        return containerElement
    }

    const createInputElement = (name, courseId) => {
        const inputElement = document.createElement('input')
        inputElement.style = 'display: none;'
        inputElement.value = name
        inputElement.setAttribute('data-field', courseId)

        return inputElement
    }

    const createHrefElement = (url, name) => {
        const hrefElement = document.createElement('a')
        hrefElement.href = url
        hrefElement.target = '_blank'
        hrefElement.download = `${name}.mp4`
        hrefElement.textContent = 'link'

        return hrefElement
    }
    const createNameElement = (name, courseId) => {
        const spanElement = document. createElement('span')
        spanElement.textContent = name
        spanElement.onclick = () => {
            const target = document.querySelector(`input[data-field="${courseId}"]`)
            
            target.select()

            navigator.clipboard.writeText(target.value)

        }

        return spanElement
    }
    
    const linksContainer = document.createElement('div')
    linksContainer.style = 'width: 600px; height: 600px; overflow-y: scroll; position: fixed; top: 0; left: 0; display: flex; flex-direction: column; z-index: 99999; background: white;'

    for (const course of courses) {
        const containerElement = createContainerElement()
        const link = createHrefElement(course.videoLink, course.videoNameAfterDownload)
        const span = createNameElement(course.videoNameAfterDownload, course.fullId)
        const input = createInputElement(course.videoNameAfterDownload, course.fullId)
        containerElement.appendChild(link)
        containerElement.appendChild(span)
        containerElement.appendChild(input)

        linksContainer.appendChild(containerElement)
    }

    const bodyElement = document.querySelector('body')

    bodyElement.appendChild(linksContainer)

    document.querySelector('#vampIframe').remove()

    console.log('Done')
}

const v_body = document.querySelector('body')
const vampBody = document.createElement('div')
//for debugging
//vampBody.style = 'display: flex; width: 100vw; height: 100vh; position: fixed; z-index: 999999; top: 0; left: 0; background: white; flex-wrap: wrap; overflow-y: scroll;'
vampBody.style = 'display: block; width: 1px; height: 1px; position: fixed; z-index: -9999; right: 0; top: 0'
vampBody.id = 'vampIframe'

const vampIframes = generateIframes()

console.log('Vamp mode: Getting all videos')

vampIframes.next()

if (!document.querySelector('#vampIframe')) {
    v_body.appendChild(vampBody)
}