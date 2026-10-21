import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { addReview, deleteReview, listReviews, reviewImageFile, saveReviewImage, validateReview } from './reviews.mjs'

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6WqsAAAAASUVORK5CYII='

test('admin review with a real image persists and can be removed', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-reviews-'))
  try {
    const image = await saveReviewImage(dir, pixel)
    assert.equal(image.ok, true)
    const file = reviewImageFile(dir, image.url)
    assert.equal(file.type, 'image/png')
    assert.ok((await readFile(file.file)).length > 0)
    const created = await addReview(dir, { author: 'Ana M.', rating: 5, body: 'Très pratique.', photos: [image.url] })
    assert.equal(created.ok, true)
    assert.equal(created.review.verified, false)
    assert.equal((await listReviews(dir)).length, 1)
    assert.equal(await deleteReview(dir, created.review.id), true)
    assert.deepEqual(await listReviews(dir), [])
    await assert.rejects(readFile(file.file))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('invalid ratings, image paths and payloads are rejected', async () => {
  assert.equal(validateReview({ author: 'A', rating: 6, body: 'B' }).ok, false)
  assert.equal(validateReview({ author: 'A', rating: 5, body: 'B', photos: ['https://other.example/a.png'] }).ok, false)
  assert.equal(validateReview({ author: '', rating: 5, body: 'B' }).ok, false)
  assert.equal(reviewImageFile('x', '/review-images/../secret.png'), null)
  assert.equal(validateReview({ author: 'A', rating: 5, body: 'B', source: { label: 'Source', url: 'http://example.com', variant: 'Universal+', originalDate: '2025' } }).ok, false)
  assert.equal(validateReview({ author: 'A', rating: 5, body: 'B', source: { label: 'Source', url: 'https://example.com/review', variant: 'Universal+', originalDate: '2025' } }).ok, true)
  const dir = await mkdtemp(join(tmpdir(), 'ariel-reviews-'))
  try { assert.equal((await saveReviewImage(dir, 'data:image/png;base64,ZmFrZQ==')).ok, false) }
  finally { await rm(dir, { recursive: true, force: true }) }
})
