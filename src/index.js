export class Worona {
  constructor() {
    this.packages = {};
  }

  addPackage({ namespace, module }) {
    this.packages[namespace] = module;
  }

  dep(namespace, type, func) {
    try {
      return this.packages[namespace][type][func]
    } catch (error) {
      throw new Error(`Error retrieving dependency: '${namespace}', '${type}', '${func}'`);
    }
  }
}

const worona = new Worona();
if (typeof window !== 'undefined' && !window.worona) { window.worona = worona; };

export default worona;
export const addPackage = worona.addPackage.bind(worona);
export const dep = worona.dep.bind(worona);
