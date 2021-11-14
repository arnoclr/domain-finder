var tlds = [] // Google domains supported LTDs
var tldsAll = [] // All IANA registred LTDs
const input = document.getElementById('input')
const box = document.getElementById('box')
const urlFrag = document.getElementById('url')

fetch('https://domain-finder.arnocellarier.fr/assets/data.csv')
.then(x => x.text())
.then(data => {
    tlds = data.toLowerCase().split('\n')
    tlds.forEach((s, i) => {
        tlds[i] = s.split(',')
    })
    initSearch()
})

fetch('https://data.iana.org/TLD/tlds-alpha-by-domain.txt')
.then(x => x.text())
.then(data => {
    tldsAll = data.toLocaleLowerCase().split('\n')
    tldsAll.shift()
    initSearch()
})

function initSearch() {
    const fragment = window.location.hash.substring(1)
    if(fragment.includes('search=')) {
        var search = fragment.split('=')[1]
        input.value = search
        find(2)
    }
}

function splitAt(value, index) {
    return [value.substring(0, index), value.substring(index)]
}

// https://stackoverflow.com/a/20762713/11651419
function mode(arr) {
    return arr.sort((a,b) =>
          arr.filter(v => v===a).length
        - arr.filter(v => v===b).length
    ).pop()
}

// https://stackoverflow.com/a/1909508/11651419
function delay(fn, ms) {
    let timer = 0
    return function(...args) {
        clearTimeout(timer)
        timer = setTimeout(fn.bind(this, ...args), ms || 0)
    }
}

function find(n) {
    var parts = splitAt(input.value, input.value.length - n)
    var result = tlds.find(x => x[0] === '.' + parts[1])
    if(result) {
        var domain = parts[0]
        var tld = parts[1]
        var priceString = result[1]
        var price = {
            amount: priceString.split(' ')[0].substring(1),
            currency: priceString.split(' ')[1],
            symbol: priceString.charAt(0)
        }
        renderBox(domain, tld, price)
    } else if(n <= 5) {
        renderBox()
        find(++n)
    } else {
        extendedFind(2)
    }
}

function extendedFind(n) {
    var parts = splitAt(input.value, input.value.length - n)
    var result = tldsAll.includes(parts[1])
    if(result) {
        var domain = parts[0]
        var tld = parts[1]
        renderBox(domain, tld)
    } else if(n <= 5) {
        renderBox()
        extendedFind(++n)
    } else {
        listSimilarTlds()
    }
}

function listSimilarTlds() {
    var letters = input.value.split('')
    var indexes = []
    letters.forEach(l => {
        tldsAll.some((x, i) => {
            var match = x.includes(l)
            var small = x.length < 5
            if (match && small) {
                indexes.push(i)
            }
        })
    })
    var bestMatch = mode(indexes)
    box.innerHTML = 
        `<div b>
            <p>No domain matches this search.
            <br>Here is the most similar : .${tldsAll[bestMatch]}</p>
        </div>`
}

async function checkAvailability(domain, tld) {
    try {
        const url = `https://check-domain-availability.arnoclr.workers.dev/?domain=${domain}.${tld}`
        const reponse = await fetch(url)
        const data = await reponse.json()
        return data
    } catch (error) {
        console.log(error)
        return { error }
    }
}

async function renderBox(domain = null, tld, price, match) {
    if(domain == undefined)
        return box.innerHTML = null

    var domainInfo = await checkAvailability(domain, tld)

    var html = `<div m>`
    if (!domainInfo.available) {
        html += `<div class="d">
            <span>Domain already taken</span>
        </div>`
    } else if(domain.length <= 3) {
        html += `<div class="d">
            <span>Small domains are expensive</span>
        </div>`
    }
    html += `<a h1 href="http://${domain}.${tld}" 
            target="_blank">${domain}.${tld}
            <i class="mdl2 mdl2-go" aria-hidden="true"></i>
        </a>`
    if(price) {
        html += `<a href="https://domains.google.com/registrar/search?searchTerm=${domain}.${tld}"
            target="_blank" ${!domainInfo.available ? 'disabled' : ''} l>Buy on Google domains</a>
        <p>Prices may vary depending on domain name and date.</p>`
    } else {
        html += `<p>This domain is correct but isn't available on Google domains. It can be available at registration or reserved.</p>`
    }
    html += `</div>`
    if(price) {
        html += `<div p>
            <span a>${price.amount}<sup>${price.symbol}</sup></span>
            <span c>(${price.currency}) /y</span>
        </div>`
    }
    return box.innerHTML = `<div b>${html}</div>`
}

input.addEventListener('keyup', delay(() => {
    if(input.value.length <= 3)
        return box.innerText = null
    input.value = input.value.replace(/[^a-zA-Z0-9-_]/g, '-')
    urlFrag.href = `#search=${input.value}`
    urlFrag.click()
    find(2)
}, 500))

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('w').style.display = ''
    document.getElementById('l').style.display = 'none'
})
