export class Worona {
  constructor() {
    this.packages = {};
  }

  addPackage({ namespace, module }) {
    if (!namespace || !module)
      throw new Error('Package not added because namespace or module is missing.');
    this.packages[namespace] = module;
  }

  dep(namespace, obj, prop) {
    try {
      return prop ? this.packages[namespace][obj][prop] : this.packages[namespace][obj];
    } catch (error) {
      throw new Error(
        `Error retrieving dependency: '${namespace}', '${obj}'${prop ? `, '${prop}'` : ''}.`
      );
    }
  }
}

const worona = new Worona();
if (typeof window !== 'undefined' && !window.worona) {
  window.worona = worona;
}

export default worona;
export const addPackage = worona.addPackage.bind(worona);
export const dep = worona.dep.bind(worona);
