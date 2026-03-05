/**
 * Promise wrapper around wx.request.
 * Usage: request.post(url, data).then(...).catch(...)
 */

function post(url, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      data,
      header: { 'Content-Type': 'application/json' },
      timeout: 60000,
      success(res) {
        if (res.statusCode >= 400) {
          const msg = (res.data && res.data.error) ? res.data.error : `Request failed (${res.statusCode})`
          reject(new Error(msg))
        } else {
          resolve(res.data)
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || 'Network request failed'))
      },
    })
  })
}

function get(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'GET',
      timeout: 30000,
      success(res) {
        if (res.statusCode >= 400) {
          const msg = (res.data && res.data.error) ? res.data.error : `Request failed (${res.statusCode})`
          reject(new Error(msg))
        } else {
          resolve(res.data)
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || 'Network request failed'))
      },
    })
  })
}

module.exports = { post, get }
