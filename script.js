const lessonSections = document.querySelectorAll('.classroom-toc-section');

const sections = []

let courses = []

let brokenLinks = []

let retryEnabled = true

let retryCount = 0

lessonSections.forEach((element, sectionIndex) => {

    const sectionIndexFormatted = `${sectionIndex}`.padStart(2, '0')

    if (!sections.find(section => section.sectionIndex === sectionIndexFormatted)) {
        sections.push({
            sectionIndex: sectionIndexFormatted,
            courses: []
        })
    }

    const courseItems = element.querySelectorAll('.classroom-toc-item:not([data-toc-content-id*="Assessment"]) .classroom-toc-item__link')

    for (let [courseIndex, item] of courseItems.entries()) {

        let courseTitle = item.getAttribute('href')

        courseTitle = courseTitle.match(/\/([A-Za-z0-9]+(_[A-Za-z0-9]+)+|[A-Za-z0-9-_]+)\?/g)[0]
        courseTitle = courseTitle.replace('/', '').replace('?', '').replaceAll('-', '_')

        const courseIndexFormatted = `${courseIndex}`.padStart(2, '0')

        const id = `${sectionIndexFormatted}_${courseIndexFormatted}`

        const link = item.getAttribute('href').replace('autoplay=true', 'autoplay=false')

        courses.push({
            id,
            link,
            videoNameAfterDownload: `${sectionIndexFormatted}_${courseIndexFormatted}_${courseTitle}`,
            videoLink: ''
        })
    }
})

function disableRetry() {
    retryEnabled = false;
    console.log(`%cVamp mode: Retry disabled`, 'background: yellow; color: white;')
}

const awaitTimeout = delay =>
    new Promise(resolve => setTimeout(resolve, delay));

async function downloadFile(url, fileName) {
    let response = await fetch(url, {
        method: 'get',
        headers: {
            Accept: 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
            'Sec-Fetch-Dest': 'video'
        }
    })

    response = await response.blob()

    const urlObject = URL.createObjectURL(response)

    const linkAttributes = [
        { attr: 'download', value: fileName },
        { attr: 'href', value: urlObject },
        { attr: 'target', value: '_blank'}
    ]

    const downloadLink = document.createElement('a')

    for (const attribute of linkAttributes) {
        const { attr, value } = attribute
        downloadLink.setAttribute(attr, value)
    }

    downloadLink.click()

    URL.revokeObjectURL(urlObject)

    downloadLink.remove()
}

async function downloadVideos(prefix = '', interval = 5000) {
    for await (const [index, course] of courses.entries()) {

        let response
        try {
            await awaitTimeout(interval)
            response = await fetch(course.link)
        } catch (e) {
            break;
        }

        response = await response.text()

        const dummyHtml = document.createElement('html')
        dummyHtml.innerHTML = response

        let url = dummyHtml.innerHTML.match(/https:\/\/dms.licdn.com\/playlist\/[a-zA-Z0-9_-]+\/learning-original-video-vbr-720\/[A-Za-z0-9]\/[0-9]+\?[a-zA-Z]=[0-9]+&[a-zA-Z]+;v=[a-zA-Z]+&[a-zA-Z]+;t=[a-zA-Z0-9-_]+/g)

        if (url) {
            url = url[0].replaceAll('&amp;', '&')

            console.log(url)

            await downloadFile(url, course.videoNameAfterDownload + '.mp4')

            console.log(`%cVamp mode: ${Math.floor((100 / courses.length) * (index + 1))}% percent done.`, 'background: green; color: white;')


        } else {
            console.error(course.id)
            brokenLinks.push(course.id)
        }
    }

    if (brokenLinks.length > 0 && retryEnabled && retryCount < 3) {
        courses = courses.filter(courseId => {
            return brokenLinks.includes(course.id)
        })
        console.log(`%cVamp mode: Got broken links will retry after 10 seconds. To disable retry call disableRetry() function.`, 'background: red; color: white;')

        retryCount++

        await awaitTimeout(10000)

        await downloadVideos()

    } else if (retryCount === 3) {
        console.log(`%cVamp mode: Finished with broken links`, 'background: brown; color: white;')
    }

    console.log(`%cVamp mode: Finished`, 'background: green; color: white;')
}

await downloadVideos()
