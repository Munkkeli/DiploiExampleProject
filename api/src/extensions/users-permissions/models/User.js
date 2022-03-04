module.exports = {
  lifecycles: {
    beforeCreate(event) {
      const { data, where, select, populate } = event.params;

      console.log("create user :)");
    },

    afterCreate(event) {
      const { result, params } = event;

      console.log("we have created a user :)", result);
    },
  },
};
