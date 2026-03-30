/**
 * Converte objetos Prisma para JSON puro,
 * transformando Decimal → Number e Date → ISO string.
 */
function toJSON(data) {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (value !== null && value !== undefined && typeof value === 'object') {
        if (value.constructor?.name === 'Decimal') return parseFloat(value.toString());
      }
      return value;
    })
  );
}

module.exports = { toJSON };
