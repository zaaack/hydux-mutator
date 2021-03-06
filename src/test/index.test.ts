import * as assert from 'assert'
import * as mutator from '../index'
import * as util from 'util'
import Parser from '../parser'
import * as Immutable from 'immutable'

function sleep(ns) {
  return new Promise(resolve => setTimeout(resolve, ns))
}

class Category {
  name = 'novel'
  count = 123
  get count2 () {
    return this.count
  }
  set count3(val) {
    this.count = val
  }
  count4() {
    return this.count
  }
}
const originalBook = {
  title: {
    zh: '哈利·波特与魔法石',
    en: 'Harry Potter and the Philosopher\'s Stone',
  },
  category: new Category(),
  author: 'J. k. rowling',
  tags: ['novel', 'magic'],
  pub_date: new Date('2017-7-11'),
}

const book = {
  title: {
    zh: '哈利·波特与魔法石',
    en: ('Harry Potter and the Philosopher\'s Stone' as (null | string)),
  },
  category: new Category(),
  author: 'J. k. rowling',
  tags: ['novel', 'magic'],
  pub_date: new Date('2017-7-11'),
}

describe('setIn', () => {
  it('simple', () => {
    const newBook = mutator.setIn(book, _ => _.author, 'J')
    assert.equal(newBook.author, 'J', 'author')
    assert.equal(book.author, originalBook.author, 'original author')
    assert.notEqual(newBook, book, 'book')
    assert.equal(newBook.category, book.category, 'category should keep')
    assert.equal(newBook.pub_date, book.pub_date, 'pub_date should keep')
  })
  it('simple2', () => {
    const newBook = mutator.setIn(book, _ => _.title.en, 'Harry Potter and something...')
    assert.deepEqual(book, originalBook, 'book shouldn\'t change')
    assert.equal(newBook.title.en, 'Harry Potter and something...', 'title.en should change')
    assert.equal(newBook.title.zh, '哈利·波特与魔法石', 'title.zh shouldn\'t change')
    assert(newBook.tags === book.tags)
    assert.deepEqual(newBook.tags, book.tags)
    assert.deepEqual(newBook.category, book.category)
    assert.notEqual(newBook, book)
    assert.notEqual(newBook.title, book.title)
  })

  it('class', () => {
    const newBook = mutator.setIn(book, _ => _.category.name, 'book')
    assert(newBook.category.name === 'book')
    assert(newBook.category.count === book.category.count)
    assert(newBook !== book)
    assert(newBook.category !== book.category)
    assert(newBook.title === book.title)
    assert(newBook.category.count2 === book.category.count2)
    newBook.category.count3 = 10
    assert(newBook.category.count === 10)
    assert(book.category.count === originalBook.category.count)
    assert(newBook.category.count4() === newBook.category.count)
    assert(newBook.category instanceof Category)
  })

  it('quote', () => {
    const newBook = mutator.setIn(book, _ => _['category']['name'], 'book')
    assert(newBook.category.name === 'book')
    assert(newBook.category.count === book.category.count)
    assert(newBook !== book)
    assert(newBook.category !== book.category)
    assert(newBook.title === book.title)
    assert(newBook.category instanceof Category)
  })

  it('array', () => {
    const newBook = mutator.setIn(book, _ => _.tags[0], 'N')
    assert(newBook.tags[0] === 'N', 'First tag should change')
    assert(newBook.tags[1] === 'magic', 'Second tag should keep')
    assert(newBook.tags.length === 2, 'tags length should keep')
    assert(newBook.tags instanceof Array, 'tags type should keep')
    assert(newBook.category === book.category, 'category should keep')
    assert(newBook !== book)
    assert(newBook.tags !== book.tags)
    assert(newBook.title === book.title)
    assert(newBook.category instanceof Category)
  })

  it('delete', () => {
    const newBook = mutator.setIn(book, _ => _.title.en, null)
    assert(newBook.title.en === null)
    assert(newBook.title.zh === book.title.zh)
    assert(newBook.title !== book.title)
    assert(newBook !== book)
    assert(newBook.category === book.category)
  })
})

describe('updateIn', () => {
  it('simple', () => {
    const newBook = mutator.updateIn(book, _ => _.title.en, title => title + ' (Original Edition)')
    assert.deepEqual(book, originalBook)
    assert.equal(newBook.title.en, 'Harry Potter and the Philosopher\'s Stone (Original Edition)')
    assert(newBook.tags === book.tags)
    assert.deepEqual(newBook.tags, book.tags)
    assert.notEqual(newBook, book)
    assert.notEqual(newBook.title, book.title)
  })
})

describe('dynamic updateIn', () => {
  it('simple', () => {
    const type = 'en'
    const title = 'title'
    const newBookTmp = mutator.updateIn(book, _ => _[title][type], title => title + ' tem', [title, type])
    const newBook = mutator.updateIn(book, _ => _[title][type], title => title + ' (Original Edition)', [title, type])
    assert.deepEqual(book, originalBook)
    assert.equal(newBook.title.en, 'Harry Potter and the Philosopher\'s Stone (Original Edition)')
    assert(newBook.tags === book.tags)
    assert.deepEqual(newBook.tags, book.tags)
    assert.notEqual(newBook, book)
    assert.notEqual(newBook.title, book.title)
  })
})

let newBook = mutator.setIn(book, _ => _.title.en, 'nnn')
newBook = mutator.updateIn(book, _ => _.tags, t => [...t, 'novel'])

const expected = { args: [ 'a', [ 'a1', 'a2', 'a3' ] ],
  obj: 'a',
  keyPath:
  [ { type: 'string', value: 'bb' },
    { type: 'string', value: 'cc' },
    { type: 'string', value: 'aa' },
    { type: 'number', value: 1 },
    { type: 'string', value: 'dd' },
    { type: 'variable', value: 'a1' },
    { type: 'string', value: 'cc' } ] }
const parse = str => Parser.accessor.tryParse(str)
function prettyPrint(x) {
  // let opts = { depth: null, colors: true }
  // let s = util.inspect(x, opts)
  // console.log(s)
}

describe('parser', () => {
  it('function', () => {
    console.time('parse function')
    let ast = parse(
    `function (a, [a1,a2,a3]) { return a.bb.cc['aa'][1]["dd"][a1]['cc']; }`
    )
    console.timeEnd('parse function')
    prettyPrint(ast)
    assert.deepEqual(ast, expected)
  })

  it('lambda with args', () => {
    console.time('parse lambda with args')
    let ast = parse(
      `(a, [a1,a2,a3]) => { return a.bb.cc['aa'][1]["dd"][a1]['cc']; }`
    )
    console.timeEnd('parse lambda with args')
    prettyPrint(ast)
    console.time('start')
    assert.deepEqual(ast, expected)
    console.timeEnd('start')
  })

  it('lambda', () => {
    console.time('parse lambda')
    let ast = parse(
      `_ => _.bb.cc['aa'].get('cc')[1]["dd"][a1].get(ee).get("ff")`
    )
    console.timeEnd('parse lambda')
    prettyPrint(ast)
    assert.deepEqual(ast, { args: [ '_' ],
      obj: '_',
      keyPath:
      [ { type: 'string', value: 'bb' },
        { type: 'string', value: 'cc' },
        { type: 'string', value: 'aa' },
        { type: 'string', value: 'cc' },
        { type: 'number', value: 1 },
        { type: 'string', value: 'dd' },
        { type: 'variable', value: 'a1' },
        { type: 'variable', value: 'ee' },
        { type: 'string', value: 'ff' }, ] })
  })

  it('self', () => {
    console.time('parse lambda')
    let ast = parse(
      `_ => _`
    )
    console.timeEnd('parse lambda')
    prettyPrint(ast)
    assert.deepEqual(ast, { args: [ '_' ], obj: '_', keyPath: [] })
  })
})

describe('getIn', () => {
  it('simple', () => {
    assert.equal(book.title, mutator.getIn(book, _ => _.title), 'title should work')

    assert.equal(book.tags, mutator.getIn(book, _ => _.tags), 'tags should work')
    assert.equal(book.tags[0], mutator.getIn(book, _ => _.tags[0]), 'tags item should work')
    assert.equal(undefined, mutator.getIn(book, _ => (_.tags as any).aa.bbb), 'undefined should work')
    assert.equal(undefined, mutator.getIn(book, ['aa', 'bb', 1, 2]), 'undefined for array should work')
  })
})
