![logo](images/melio-logo.svg)

## Description

Locks manager is a DynamoDB based locking system.
The manager uses atomic actions to assure tight locking,
in addition each lock holds the lock's owner so that other process can't hijack the lock.

## Purpose
This document is provide to serve as guide for the locks manager and how to use it.
The objective of this document is to understand the flow and functions available in the package.

## Scope
This document is intend for the R&D team.
It will cover all necessary instructions as well as theory.

## Introduction
When implementing locks there are two main approaches optimistic lock and mutual exclusion lock (Mutex).

#### Optimistic Locks
Optimistic locks are useful when you update data, you are aware that it could have
been updated by some other process as the same time,
and **Most** important you are o.k with it.

Optimistic locks implements the following guidelines:
1. Record a timestamp when the change begun.
2. tentatively Read/write data with your changes.
3. Check if some else made any changes on the same data
4. Resolve conflicts (if applicable) and commit your changes.

#### Mutex locks
Mutex lock are more rigid and intended for cases when you **must** have only one source of truth.
In mutex lock when one process is running there and another process is trying to make any changes
it will fail.
The second process will be noticed that the data used by another process,
and will fail to acquire lock.

Mutex locks implement the following guidelines:
1. Create lock or fail.
2. if lock acquired - update the data.
3. Release the lock.

#### Atomic actions
In order to achieve the mutex functionality using a DB atomic actions are due.
Take the following implementation, for example:

``` 
function acquireLock(lockId){
    const lock = this.dynamoDB.getLockById(id);
    if (!lock) {
        this.dynamoDB.acquireLock(id);
        return true;
    }
    return false;
}
``` 
This approach implements the optimistic lock, meaning between the ```getLockById()``` function call
and the ```acquireLock()``` function call there are is a gap, whereas short as it is there can still
be another process.
In that case the second process will get green light to proceed which is a false positive response.

![https://blog.revolve.team/2020/09/08/implement-mutex-with-dynamodb/](images/optimistic-locks.jpeg)


This locks manger is implementing the concept of mutual exclusion (mutex) locks.
It will use DynamoDB as backend and conditional expressions for create/delete actions
to assure atomic cations and exclusion.
We have also added another feature to the locks where each lock has both id and owner.  
Meaning two different processes won't be able to hijack a lock form one another.



## Usage

```
import { LocksManager} from '@melio/locksmanager'

// The options object and each of its properties are all optional.
// If not provided default values will be applied.
const options: LocksManagerOptions = {
  tableName: 'your-custom-table';
  lockTimeoutInSec: 60; // Min 30 sec
  maxAllowedTriesNumber: 15;
  lockRetryIntervalInMs: 2000;
}

LocksManager.init([options]);

const locksManager: LocksMaanger = LocksManager.getInstance();

const id = 'some-unique-id';

// Use either acquire for single attempet  
const lock = locksManager.acquire(id);

// or acquireWithRetry for multiple attempts
const lock = locksManager.acquireWithRetry(id);

...Some code need db locking 

lock.release(lock);

// Or wrap your code with lock
const cb = () => {
 ...do some code need lock
}
id = 'some-unique-id';

locksManager.withLock(id, cb);

// Check if lock exists
// Will return true if id exist and lock is active, false otherwise.
const isLocked = await locksManager.isLocked(id);
```

#### Release History
 * 1.0.0 - First release Lock manager based on DynamoDb
 * 2.0.0 - **Note! This version is not backward compatible with previous version.** The locking concept has changed. This version will set lock expiration time as `now + requested locking time`. New lock request will compare between `now` and expiration time as it was set in the record.

##### References
1. [The right way to implement a mutex with dynamodb](https://blog.revolve.team/2020/09/08/implement-mutex-with-dynamodb/)
2. [Conditional Expressions in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html)
3. [Building Distributed Locks with the DynamoDB Lock Client](https://aws.amazon.com/blogs/database/building-distributed-locks-with-the-dynamodb-lock-client/)



