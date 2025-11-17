import Agenda from "agenda";

const agenda = new Agenda({
  db: {
    address: process.env.MONGO_URL,
    collection: "agendaJobs",
  },
  processEvery: "1 minute",
});

export default agenda;