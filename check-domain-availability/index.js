/**
 * Return a JSON response from an object
 * @param {JSON} jsonObject 
 * @returns {Response} JSON response
 */
function responseJSON(jsonObject) {
  return new Response(JSON.stringify(jsonObject), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Fetch a domain name and check if it is available.
 * @param {Request} request
 */
async function handleRequest(request) {
  const params = {}
  const url = new URL(request.url)
  const queryString = url.search.slice(1).split('&')

  queryString.forEach(item => {
    const kv = item.split('=')
    if (kv[0]) params[kv[0]] = kv[1] || true
  })

  const domain = params.domain

  if (!domain) {
    return responseJSON({
      error: 'Domain name is required.',
      code: 400,
    })
  }

  const response = await fetch('https://' + domain + '/')

  if (response.status === 200 && response.ok) {
    return responseJSON({
      available: false,
      message: 'Domain is not available for sale',
      code: 200,
    })
  } else {
    return responseJSON({
      available: true,
      message: 'Domain can be available for sale',
      code: 200,
    })
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
