from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class GetRequestedFlightsByUserRequest(_message.Message):
    __slots__ = ("offset", "limit")
    OFFSET_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    offset: int
    limit: int
    def __init__(self, offset: _Optional[int] = ..., limit: _Optional[int] = ...) -> None: ...

class FlightRequestedByUserItem(_message.Message):
    __slots__ = ("requested_by_user_id", "type", "from_destination", "from_date", "to_destination", "to_date")
    REQUESTED_BY_USER_ID_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    FROM_DESTINATION_FIELD_NUMBER: _ClassVar[int]
    FROM_DATE_FIELD_NUMBER: _ClassVar[int]
    TO_DESTINATION_FIELD_NUMBER: _ClassVar[int]
    TO_DATE_FIELD_NUMBER: _ClassVar[int]
    requested_by_user_id: str
    type: str
    from_destination: str
    from_date: str
    to_destination: str
    to_date: str
    def __init__(self, requested_by_user_id: _Optional[str] = ..., type: _Optional[str] = ..., from_destination: _Optional[str] = ..., from_date: _Optional[str] = ..., to_destination: _Optional[str] = ..., to_date: _Optional[str] = ...) -> None: ...

class GetRequestedFlightsByUserResponse(_message.Message):
    __slots__ = ("items",)
    ITEMS_FIELD_NUMBER: _ClassVar[int]
    items: _containers.RepeatedCompositeFieldContainer[FlightRequestedByUserItem]
    def __init__(self, items: _Optional[_Iterable[_Union[FlightRequestedByUserItem, _Mapping]]] = ...) -> None: ...

class SendProcessedFlightsByCrawlerRequest(_message.Message):
    __slots__ = ("processed_items",)
    PROCESSED_ITEMS_FIELD_NUMBER: _ClassVar[int]
    processed_items: _containers.RepeatedCompositeFieldContainer[FlightRequestedByUserItem]
    def __init__(self, processed_items: _Optional[_Iterable[_Union[FlightRequestedByUserItem, _Mapping]]] = ...) -> None: ...

class SendProcessedFlightsByCrawlerResponse(_message.Message):
    __slots__ = ("success", "message")
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    success: bool
    message: str
    def __init__(self, success: bool = ..., message: _Optional[str] = ...) -> None: ...
