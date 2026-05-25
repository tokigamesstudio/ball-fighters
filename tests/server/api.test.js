import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/app.js';
import { createMemoryStore } from '../../server/stores/memory.js';

describe('HTTP API', () => {
  let app;
  let store;

  beforeEach(() => {
    store = createMemoryStore();
    app = createApp(store);
  });

  it('POST /round/create returns 201 with roundId, seedHash, odds', async () => {
    const res = await request(app)
      .post('/round/create')
      .send({ fighterA: 'blaze', fighterB: 'quake' })
      .expect(201);

    expect(res.body).toHaveProperty('roundId');
    expect(res.body).toHaveProperty('seedHash');
    expect(res.body).toHaveProperty('oddsA');
    expect(res.body).toHaveProperty('oddsB');
    expect(typeof res.body.roundId).toBe('string');
    expect(typeof res.body.seedHash).toBe('string');
    expect(typeof res.body.oddsA).toBe('number');
    expect(typeof res.body.oddsB).toBe('number');
  });

  it('POST /round/bet returns 201 with betId, odds, potentialPayout', async () => {
    const createRes = await request(app)
      .post('/round/create')
      .send({ fighterA: 'blaze', fighterB: 'quake' });

    const res = await request(app)
      .post('/round/bet')
      .send({ roundId: createRes.body.roundId, playerId: 'p1', fighter: 'blaze', stake: 10 })
      .expect(201);

    expect(res.body).toHaveProperty('betId');
    expect(res.body).toHaveProperty('odds');
    expect(res.body).toHaveProperty('potentialPayout');
    expect(typeof res.body.betId).toBe('string');
    expect(typeof res.body.odds).toBe('number');
    expect(typeof res.body.potentialPayout).toBe('number');
  });

  it('POST /round/resolve returns 200 with winner and payouts', async () => {
    const createRes = await request(app)
      .post('/round/create')
      .send({ fighterA: 'blaze', fighterB: 'quake' });

    await request(app)
      .post('/round/bet')
      .send({ roundId: createRes.body.roundId, playerId: 'p1', fighter: 'blaze', stake: 10 });

    const res = await request(app)
      .post('/round/resolve')
      .send({ roundId: createRes.body.roundId })
      .expect(200);

    expect(res.body).toHaveProperty('winner');
    expect(res.body).toHaveProperty('payouts');
    expect(Array.isArray(res.body.payouts)).toBe(true);
  });

  it('GET /round/:id returns 200 with round details', async () => {
    const createRes = await request(app)
      .post('/round/create')
      .send({ fighterA: 'blaze', fighterB: 'quake' });

    const res = await request(app)
      .get(`/round/${createRes.body.roundId}`)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('fighterA');
    expect(res.body).toHaveProperty('fighterB');
    expect(res.body).toHaveProperty('oddsA');
    expect(res.body).toHaveProperty('oddsB');
    expect(res.body.status).toBe('open');
  });

  it('POST /round/bet with invalid fighter returns 400', async () => {
    const createRes = await request(app)
      .post('/round/create')
      .send({ fighterA: 'blaze', fighterB: 'quake' });

    await request(app)
      .post('/round/bet')
      .send({ roundId: createRes.body.roundId, playerId: 'p1', fighter: 'air', stake: 10 })
      .expect(400);
  });

  it('POST /round/bet with stake <= 0 returns 400', async () => {
    const createRes = await request(app)
      .post('/round/create')
      .send({ fighterA: 'blaze', fighterB: 'quake' });

    await request(app)
      .post('/round/bet')
      .send({ roundId: createRes.body.roundId, playerId: 'p1', fighter: 'blaze', stake: 0 })
      .expect(400);
  });

  it('POST /round/resolve on already-resolved round returns 409', async () => {
    const createRes = await request(app)
      .post('/round/create')
      .send({ fighterA: 'blaze', fighterB: 'quake' });

    await request(app)
      .post('/round/resolve')
      .send({ roundId: createRes.body.roundId });

    await request(app)
      .post('/round/resolve')
      .send({ roundId: createRes.body.roundId })
      .expect(409);
  });

  it('GET /round/:id with unknown id returns 404', async () => {
    await request(app)
      .get('/round/unknown-id')
      .expect(404);
  });

  it('POST /round/resolve reveals seed in response', async () => {
    const createRes = await request(app)
      .post('/round/create')
      .send({ fighterA: 'blaze', fighterB: 'quake' });

    const res = await request(app)
      .post('/round/resolve')
      .send({ roundId: createRes.body.roundId })
      .expect(200);

    expect(res.body).toHaveProperty('seed');
    expect(typeof res.body.seed).toBe('string');
  });

  it('POST /round/create with missing fighters returns 400', async () => {
    await request(app)
      .post('/round/create')
      .send({ fighterA: 'blaze' })
      .expect(400);

    await request(app)
      .post('/round/create')
      .send({ fighterB: 'quake' })
      .expect(400);

    await request(app)
      .post('/round/create')
      .send({})
      .expect(400);
  });
});
