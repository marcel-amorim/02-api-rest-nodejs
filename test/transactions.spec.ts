import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import request from 'supertest'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  type Transaction = {
    title: string
    amount: number
    type: 'credit' | 'debit'
  }

  const transaction: Transaction = {
    title: 'New Transaction',
    amount: 5000,
    type: 'credit',
  }

  const createTransaction = async (
    props = transaction,
    cookies: string[] = [],
  ) => {
    return await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send(props)
  }

  it('should be able to create a new transaction', async () => {
    const response = await createTransaction()
    expect(response.statusCode).toBe(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await createTransaction()

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies ?? [])
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: transaction.title,
        amount: transaction.amount,
      }),
    ])
  })

  it('should be able get a transaction', async () => {
    const createTransactionResponse = await createTransaction()

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies ?? [])
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies ?? [])
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        id: transactionId,
        title: transaction.title,
        amount: transaction.amount,
      }),
    )
  })

  it('should be able get summary', async () => {
    const createTransactionResponse = await createTransaction()

    const cookies = createTransactionResponse.get('Set-Cookie')

    await createTransaction(
      {
        title: 'New Debit Transaction',
        amount: 3000,
        type: 'debit',
      },
      cookies,
    )

    const summaryTransactionResponse = await request(app.server)
      .get(`/transactions/summary`)
      .set('Cookie', cookies ?? [])
      .expect(200)

    expect(summaryTransactionResponse.body.summary).toEqual({
      amount: 2000,
    })
  })
})
