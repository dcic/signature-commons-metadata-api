export class UniqueIDGenerator {
  _id: number;

  constructor() {
    this._id = 0;
  }

  id(): number {
    const id = this._id;
    this._id += 1;
    return id;
  }
}

export default UniqueIDGenerator;
