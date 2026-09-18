export class AppError extends Error { constructor(public readonly code:string, message:string, public readonly status=500, public readonly details?:unknown){ super(message); this.name="AppError"; } }
