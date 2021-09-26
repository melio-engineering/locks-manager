import chai from 'chai';
import { expect } from 'chai';
import chaiPromise = require('chai-as-promised');
import { Model } from 'dynamoose/dist/Model';
import sinon from 'sinon';
import { CouldNotAcquireLockError } from '../errors/could-not-acquire-lock-error';
import { LocksManager } from '../index';
import { Timers } from '../utils/timers';


const CONDITION_FAILED_ERROR_CODE = 'ConditionalCheckFailedException';
const { assert } = chai;
const sandbox = sinon.createSandbox();

let dynamooseModelCreateStub: any;
let delayStub: any;
let locksManager: any;

chai.use(chaiPromise);

describe('Dynamodb locks manager', () => {

  before(() => {
    locksManager = LocksManager.init().getInstance();
  })

  beforeEach(() => {
    dynamooseModelCreateStub = sandbox.stub(Model.prototype, 'create');
    delayStub = sandbox.stub(Timers, 'delay');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Can create lock', async () => {
    const id = 'test_lock_id';
    dynamooseModelCreateStub.returns({
      id,
      owner: 'unique-hash-id',
      try: 1,
    });
    const lock = await locksManager.acquireWithRetry(id);
    assert.equal(lock.id, id, 'Failed to acquire lock');
    assert.equal(dynamooseModelCreateStub.callCount, 1);
  });

  it('throws an error if maxed out all tries to acquire lock', async () => {
    const error: any = new Error('Failed to acquire lock');
    error.code = CONDITION_FAILED_ERROR_CODE;
    dynamooseModelCreateStub.throws(error);

    const id = 'test_lock_id';
    await expect(locksManager.acquireWithRetry(id)).to.be.rejectedWith(CouldNotAcquireLockError, 'Failed to acquire lock');
    assert.equal(delayStub.callCount, 10);
  });

  it('throws error on dynamo custom error ', async () => {
    const unAcceptableError = new Error('Any given Dynamo exception');
    const id = 'test_lock_id';

    dynamooseModelCreateStub.onCall(0).throws(unAcceptableError);
    // We shouldn't reach this call
    dynamooseModelCreateStub.onCall(1).returns({
      id,
      owner: 'unique-hash-id',
      try: 1,
    });
    await expect(locksManager.acquireWithRetry(id)).to.be.rejectedWith(CouldNotAcquireLockError, 'Any given Dynamo exception');
    assert.equal(dynamooseModelCreateStub.callCount, 1);
  });

  it('will eventually acquire lock', async () => {
    const error: any = new Error('Failed to acquire lock');
    error.code = CONDITION_FAILED_ERROR_CODE;
    const id = 'test_lock_id';
    dynamooseModelCreateStub.onCall(0).throws(error);
    dynamooseModelCreateStub.onCall(1).throws(error);
    dynamooseModelCreateStub.onCall(2).throws(error);
    dynamooseModelCreateStub.onCall(3).throws(error);
    dynamooseModelCreateStub.onCall(4).throws(error);
    dynamooseModelCreateStub.onCall(5).throws(error);
    dynamooseModelCreateStub.onCall(6).returns({
      id,
      try: 6,
    });

    const lock = await locksManager.acquireWithRetry(id);
    assert.equal(lock.id, id, 'Failed to acquire lock for vendor');
    assert.equal(dynamooseModelCreateStub.callCount, 7);
    assert.equal(delayStub.callCount, 6);
  });

  it('can release a lock', async () => {
    // Delete is void function, no need to return
    const dynamooseModelDeleteStub = sandbox.stub(Model.prototype, 'delete');
    const id = 'test_lock_id';
    dynamooseModelCreateStub.returns({
      id,
      owner: 'unique-hash-id',
      try: 1,
    });
    const lock = await locksManager.acquireWithRetry(id);
    await locksManager.release(lock);
    assert.equal(dynamooseModelCreateStub.callCount, 1);
    assert.equal(delayStub.callCount, 0);
    assert.equal(dynamooseModelDeleteStub.callCount, 1);
  });

  it('throws error when fail to release a lock', async () => {
    const dynamooseModelDeleteStub = sandbox.stub(Model.prototype, 'delete');
    const error: any = new Error('Did not met the delete condition requirements');
    error.code = CONDITION_FAILED_ERROR_CODE;
    dynamooseModelDeleteStub.throws(error);

    const id = 'test_lock_id';
    dynamooseModelCreateStub.returns({
      id,
      owner: 'unique-hash-id',
      try: 1,
    });
    const lock = await locksManager.acquireWithRetry(id);
    await expect(
      locksManager.release(lock),
    ).to.be.rejectedWith('Did not met the delete condition requirements');
    assert.equal(dynamooseModelCreateStub.callCount, 1);
    assert.equal(delayStub.callCount, 0);
    assert.equal(dynamooseModelDeleteStub.callCount, 1);
  });
});
