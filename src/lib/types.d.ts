import {Params} from 'tiny-request-router'

// Type for handlers
export type Handler = (
    request: Request,
    params: Params,
    background: Promise<any>[]
) => Promise<Response> | Response
