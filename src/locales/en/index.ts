import common from './common.json'
import auth from './auth.json'
import content from './content.json'
import profile from './profile.json'

// Merge profundo para combinar objetos anidados sin sobrescribir
const deepMerge = (...objects: any[]): any => {
  return objects.reduce((result, obj) => {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        result[key] = deepMerge(result[key] || {}, obj[key])
      } else {
        result[key] = obj[key]
      }
    })
    return result
  }, {})
}

export default deepMerge(common, auth, content, profile)
