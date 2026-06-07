import { dataGraphsTopicContract } from './generators/math/topics/data-graphs/index.js';
import { somTopicContract } from './generators/math/topics/standard-object-measurement/index.js';
import { ukgNumbersCountingTopicContract } from './generators/math/topics/ukg-numbers-counting/index.js';
import { moneyTopicContract } from './generators/math/topics/money/index.js';

export const topicContracts = [
  dataGraphsTopicContract,
  somTopicContract,
  ukgNumbersCountingTopicContract,
  moneyTopicContract
];

export function findTopicContract(subject, topic) {
  return topicContracts.find(
    (contract) => contract.subject === subject && contract.topic === topic
  );
}
