import http from 'http';
import { shellExec } from './shellExec.mjs';

const Status = {
  GREEN: 'green',
  GREY: 'gray',
  YELLOW: 'yellow',
  RED: 'red',
};

const supervisorStatusToStatus = {
  STOPPED: Status.GREY,
  STARTING: Status.YELLOW,
  RUNNING: Status.GREEN,
  BACKOFF: Status.RED,
  STOPPING: Status.YELLOW,
  EXITED: Status.GREY,
  FATAL: Status.RED,
  UNKNOWN: Status.GREY,
};

const processStatusToMessage = (name, status) => {
  if (status === Status.GREEN) return `${name} process is running`;
  if (status === Status.YELLOW) return `${name} process is having issues`;
  if (status === Status.RED) return `${name} process has failed to start`;
  return `${name} process is stopped`;
};

const getSupervisorStatus = async (name, process) => {
  let status = Status.GRAY;
  let isPending = true;

  const processStatus = (await shellExec(`supervisorctl status ${process}`)).stdout || '';
  if (!processStatus.includes('ERROR')) {
    const supervisorStatus = processStatus.split(' ').filter((item) => !!item.trim())[1];
    status = supervisorStatusToStatus[supervisorStatus] || Status.GRAY;
    isPending = status === Status.GRAY;
  }

  return {
    status,
    isPending,
    message: processStatusToMessage(name, status),
  };
};

const getAPIStatus = async () => {
  try {
    const strapiResponse = JSON.parse((await shellExec('curl http://app/api')).stdout);
    if (strapiResponse && strapiResponse.error?.message === 'Not Found') {
      return {
        status: Status.GREEN,
        message: '',
      };
    }

    return {
      status: Status.RED,
      message: 'Strapi API is not responding',
    };
  } catch {
    return {
      status: Status.RED,
      message: 'Strapi API is not responding',
    };
  }
};

const getWWWStatus = async () => {
  try {
    const nextjsResponse = (await shellExec('curl http://app')).stdout;
    if (nextjsResponse && nextjsResponse.includes('__NEXT_DATA__')) {
      return {
        status: Status.GREEN,
        message: '',
      };
    }

    return {
      status: Status.RED,
      message: 'Next.js is not responding',
    };
  } catch {
    return {
      status: Status.RED,
      message: 'Next.js is not responding',
    };
  }
};

const getPostgresStatus = async () => {
  const commonStatus = {
    identifier: 'postgres',
    name: 'PostgreSQL',
    description: 'PostgreSQL database',
    items: [],
  };

  try {
    const postgresResponse = (await shellExec('pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT')).stdout;
    if (postgresResponse && postgresResponse.includes('accepting connections')) {
      return {
        ...commonStatus,
        status: Status.GREEN,
        message: '',
      };
    }

    return {
      ...commonStatus,
      status: Status.RED,
      message: 'PostgreSQL is not responding',
    };
  } catch {
    return {
      ...commonStatus,
      status: Status.RED,
      message: 'PostgreSQL is not responding',
    };
  }
};

const getRedisStatus = async () => {
  const commonStatus = {
    identifier: 'redis',
    name: 'Redis',
    description: 'Redis cache',
    items: [],
  };

  try {
    const redisResponse = (await shellExec('(printf "AUTH $REDIS_PASS\r\n";) | nc -q 1 $REDIS_HOST $REDIS_PORT')).stdout;
    if (redisResponse && redisResponse.includes('OK')) {
      return {
        ...commonStatus,
        status: Status.GREEN,
        message: '',
      };
    }

    return {
      ...commonStatus,
      status: Status.RED,
      message: 'Redis is not responding',
    };
  } catch {
    return {
      ...commonStatus,
      status: Status.RED,
      message: 'Redis is not responding',
    };
  }
};

const getStatus = async () => {
  const apiProcessStatus = await getSupervisorStatus('Strapi', 'api');

  let apiStatus = {
    identifier: 'api',
    name: 'Strapi',
    description: 'Strapi API',
    items: [],
    ...apiProcessStatus,
  };

  if (apiProcessStatus.status === Status.GREEN) {
    apiStatus = { ...apiStatus, ...(await getAPIStatus()) };
  }

  const wwwProcessStatus = await getSupervisorStatus('Next.js', 'www');

  let wwwStatus = {
    identifier: 'www',
    name: 'Next.js',
    description: 'Next.js site',
    items: [],
    ...wwwProcessStatus,
  };

  if (wwwProcessStatus.status === Status.GREEN) {
    wwwStatus = { ...wwwStatus, ...(await getWWWStatus()) };
  }

  const proxyProcessStatus = await getSupervisorStatus('Proxy', 'proxy');

  let proxyStatus = {
    identifier: 'proxy',
    name: 'Proxy',
    description: 'Traefik proxy routing Strapi & Next.js traffic',
    items: [],
    ...proxyProcessStatus,
    message: proxyProcessStatus.status === Status.GREEN ? '' : proxyProcessStatus.message,
  };

  const postgresStatus = await getPostgresStatus();
  const redisStatus = await getRedisStatus();

  const status = {
    diploiStatusVersion: 1,
    items: [apiStatus, wwwStatus, proxyStatus, postgresStatus, redisStatus],
  };

  return status;
};

const requestListener = async (req, res) => {
  res.writeHead(200);
  res.end(JSON.stringify(await getStatus()));
};

const server = http.createServer(requestListener);
server.listen(3003, '127.0.0.1');
