class ServiceError(Exception):
    """Base class for business-rule errors; routers map these to HTTP status codes."""


class NotFoundError(ServiceError):
    pass


class ConflictError(ServiceError):
    pass


class BusinessRuleError(ServiceError):
    pass
