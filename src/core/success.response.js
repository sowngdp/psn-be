'use strict';

const HttpStatusCode = {
  OK: 200,
  CREATED: 201
};

class SuccessResponse {
  constructor({ message, statusCode = HttpStatusCode.OK, metadata = {} }) {
    this.message = message;
    this.status = statusCode;
    this.metadata = metadata;
  }

  send(res) {
    return res.status(this.status).json(this);
  }
}

class OK extends SuccessResponse {
  constructor({ message, metadata }) {
    super({ message, metadata });
  }
}

class CREATED extends SuccessResponse {
  constructor({ message, metadata }) {
    super({ message, statusCode: HttpStatusCode.CREATED, metadata });
  }
}

module.exports = {
  OK,
  CREATED
};
