// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_cloudy_post.sql';
import m0001 from './0001_known_cassandra_nova.sql';
import m0002 from './0002_calm_gorilla_man.sql';
import m0003 from './0003_bouncy_stardust.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
  },
};
