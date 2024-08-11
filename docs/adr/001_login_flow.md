# 001 - Login Flow
**Status**: Proposed
**Created**: 2024-08-11
**Updated**: 2024-08-11

## Context

The site needs a way to register and manage users.

## Proposal
The below workflow is proposed. It will require email verification, which I generally dislike as it requires storing PII. But in exchange, it means less spam / abuse and a way to reset passwords via email link.

```mermaid
flowchart
    1[User navigates \n to login page]
    1 -- default --> lf
    1 -- click on register button --> rf

    subgraph lf[Login Flow]
    direction TB

    start[User enters \n information] -- submit --> res{Login \n Response}
    res -- success --> LoggedIn[Successful log in and \n user is navigated \n to home page]

    res -- user not found --> r1[Reccomend \n registration flow]
    res -- email not \n verified --> r2[Recommend \n verifying email]
    res -- bad password --> r3[Reccomend \n password reset]
    r3 --> pf
    end

    subgraph rf[Register Flow]
    direction TB

    start2[User enters \n Information] -- submit --> res2{Registration \n Response}
    res2 -- success --> ver[Start email \n verification]
    ver -- send email --> wait{Wait for Email \n Verification}

    wait -- verification \n completed in 15 days --> ver3[Recommend \n login flow]
    wait -- 15 days \n elapse --> del[Destroy unverified \n user account]
    end

    subgraph pf[Password Reset Flow]
    direction TB

    start3[User enters \n email address] -- submit --> res3{Reset Response}
    res3 -- user not found --> r5[Failure message]
    res3 -- success --> em1[Start email \n password reset]
    em1 -- send email --> wait2{Wait for \n Email Reset}
    wait2 -- 15 days \n elapse --> del2[Destroy password \n reset request]
    wait2 -- Reset link opened \n within 15 days --> n5[User opens \n passord reset page ]
    n5 --> n6[User enters \n infromation]
    n6 -- submit --> n7[Password is reset and \n user is navigated to \n login page]

    end
```
