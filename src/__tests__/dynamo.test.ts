import chai from 'chai';
import { expect } from 'chai';
import chaiPromise = require('chai-as-promised');
import { Model } from 'dynamoose/dist/Model';
import sinon from 'sinon';
import { CouldNotAcquireLockError } from '../errors/could-not-acquire-lock-error';
import { LocksManager } from '../index';


const CONDITION_FAILED_ERROR_CODE = 'ConditionalCheckFailedException';
const { assert } = chai;
const sandbox = sinon.createSandbox();

let dynamooseModelCreateStub: any;
let locksManager: any;

chai.use(chaiPromise);

describe('Dynamodb locks manager', () => {

  before(() => {
    locksManager = LocksManager.init({ maxAllowedTriesNumber: 3 }).getInstance();
  });

  beforeEach(() => {
    dynamooseModelCreateStub = sandbox.stub(Model.prototype, 'create');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Can create lock', async () => {
    const id = 'test_lock_id';
    dynamooseModelCreateStub.returns({
      id,
      owner: 'unique-hash-id',
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

    await expect(locksManager.acquireWithRetry(id)).to.be
      .rejectedWith(CouldNotAcquireLockError, 'Failed to acquire lock');

    assert.equal(dynamooseModelCreateStub.callCount, 4);

  }).timeout(5000);

  it('will eventually acquire lock', async () => {
    const error: any = new Error('Failed to acquire lock');
    error.code = CONDITION_FAILED_ERROR_CODE;
    const id = 'test_lock_id';

    dynamooseModelCreateStub.onCall(0).throws(error);
    dynamooseModelCreateStub.onCall(1).throws(error);
    dynamooseModelCreateStub.onCall(2).throws(error);
    dynamooseModelCreateStub.onCall(3).returns({
      id,
    });

    const lock = await locksManager.acquireWithRetry(id);

    assert.equal(lock.id, id, 'Failed to acquire lock for vendor');
    assert.equal(dynamooseModelCreateStub.callCount, 4);
  }).timeout(5000);

  it('will retry till sent max retries', async () => {
    const error: any = new Error('Failed to acquire lock');
    error.code = CONDITION_FAILED_ERROR_CODE;
    const id = 'test_lock_id';
    dynamooseModelCreateStub.throws(error);

    await expect(locksManager.acquireWithRetry(id, 60, 2)).to
      .be.rejectedWith(CouldNotAcquireLockError, 'Failed to acquire lock');

    assert.equal(dynamooseModelCreateStub.callCount, 3);
  }).timeout(5000);

  it('can release a lock', async () => {
    // Delete is void function, no need to return
    const dynamooseModelDeleteStub = sandbox.stub(Model.prototype, 'delete');
    const id = 'test_lock_id';
    dynamooseModelCreateStub.returns({
      id,
      owner: 'unique-hash-id',
    });
    const lock = await locksManager.acquireWithRetry(id);
    await locksManager.release(lock);
    assert.equal(dynamooseModelCreateStub.callCount, 1);
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
    });
    const lock = await locksManager.acquireWithRetry(id);

    await expect(
      locksManager.release(lock),
    ).to.be.rejectedWith('Did not met the delete condition requirements');

    assert.equal(dynamooseModelCreateStub.callCount, 1);
    assert.equal(dynamooseModelDeleteStub.callCount, 1);
  });
});
