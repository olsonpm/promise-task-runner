'use strict';
/* --execute=mocha-- */

var Lazy = require('./lazy-extensions')
    , chai = require('chai');

var assert = chai.assert;
chai.config.includeStack = true;

suite("lazy-extensions.js", function() {
    var vals
        , valsConst
        , objs
        , objsConst
        , objLit
        , objLitConst;

    function TestObj(name, val) {
        this.name = name;
        this.val = val;
    }
    TestObj.prototype.equals = function equals(other) {
        return this.name === other.name
            && this.val === other.val;
    };
    TestObj.equals = function equals(left, right) {
        return left.equals(right);
    };

    function getNewObjs() {
        return [new TestObj('name1', 'val1')
            , new TestObj('name2', 'val2')
            , new TestObj('name3', 'val3')
            , new TestObj('name4', 'val4')
            , new TestObj('name5', 'val5')
        ];
    }

    function getNewVals() {
        return [1, 2, 3, 4, 5];
    }

    function getNewObjLit() {
        return {
            'akey': 'aval'
            , 'bkey': 'bval'
            , 'ckey': 'cval'
        };
    }

    setup(function() {
        vals = Lazy(getNewVals());
        valsConst = Lazy(getNewVals());

        objs = Lazy(getNewObjs());
        objsConst = Lazy(getNewObjs());

        objLit = Lazy(getNewObjLit());
        objLitConst = Lazy(getNewObjLit());
    });
    test("Sequence.indexOf", function Sequence_indexOf() {
        assert.strictEqual(vals.indexOf(1), 0);
        assert.strictEqual(vals.indexOf(3), 2);

        assert.strictEqual(objs.indexOf(objsConst.get(0), TestObj.equals), 0);
        assert.strictEqual(objs.indexOf(objsConst.get(0), 'equals'), 0);
        assert.strictEqual(objs.indexOf(objsConst.get(3), TestObj.equals), 3);
        assert.strictEqual(objs.indexOf(objsConst.get(3), 'equals'), 3);
    });

    test("Sequence.rotate", function Sequence_rotate() {
        vals = vals.rotate(1);
        assert.strictEqual(vals.first(), valsConst.last());

        // reset vals
        vals = Lazy(getNewVals());
        vals = vals.rotate(2);
        assert.strictEqual(vals.first(), valsConst.get(3));

        vals = Lazy(getNewVals());
        vals = vals.rotate(-2);
        assert.strictEqual(vals.first(), valsConst.get(2));

        // now test for objects
    });

    test("Sequence.rotateTo", function Sequence_roateTo() {
        vals = vals.rotateTo(3);
        assert.strictEqual(vals.first(), valsConst.get(2));

        vals = Lazy(getNewVals());
        vals = vals.rotateTo(4);
        assert.strictEqual(vals.first(), valsConst.get(3));

        objs = objs.rotateTo(new TestObj('name4', 'val4'), TestObj.equals);
        assert.isTrue(objs.first().equals(objsConst.get(3)));
        objs = Lazy(getNewObjs()).rotateTo(new TestObj('name4', 'val4'), 'equals');
        assert.isTrue(objs.first().equals(objsConst.get(3)));
    });

    test("Sequence.allTypeOf", function Sequence_allTypeOf() {
        assert.isTrue(vals.allTypeOf('number'));
        assert.isTrue(objs.allTypeOf('object'));
        vals = vals.concat(['a']);
        objs = objs.concat([1]);
        assert.isFalse(vals.allTypeOf('number'));
        assert.isFalse(objs.allTypeOf('object'));
    });

    test("Sequence.allInstanceOf", function Sequence_allInstanceOf() {
        assert.isTrue(objs.allInstanceOf(TestObj));
        objs = objs.concat([1]);
        assert.isFalse(objs.allInstanceOf(TestObj));
    });

    test("Sequence.equals", function Sequence_equals() {
        assert.isTrue(vals.equals(valsConst));
        var vals2 = Lazy(getNewVals()).concat([6]);
        assert.isFalse(vals.equals(vals2));
        assert.isFalse(objs.equals(objsConst));
        assert.isTrue(objs.equals(objsConst, 'equals'));
        assert.isTrue(objs.equals(objsConst, TestObj.equals));
    });

    test("ObjectLikeSequence.keys", function ObjectLikeSequence_keys() {
        assert.isTrue(objLit.keys().equals(objLitConst.keys()));
        objLit = objLit.assign({
            'dkey': 'dval'
        });
        assert.isFalse(objLit.keys().equals(objLitConst.keys()));
    });

    test("ObjectLikeSequence.values", function ObjectLikeSequence_keys() {
        assert.isTrue(objLit.values().equals(objLitConst.values()));
        objLit = objLit.assign({
            'dkey': 'dval'
        });
        assert.isFalse(objLit.values().equals(objLitConst.values()));
    });

    test("KeySequence.toArray", function KeySequence_toArray() {
        var keyArray = objLitConst.keys().toArray();
        var expectedKeyArray = Object.keys(getNewObjLit());

        assert.strictEqual(keyArray[0], expectedKeyArray[0]);
        assert.strictEqual(keyArray[2], expectedKeyArray[2]);
    });

    test("KeySequence.each", function KeySequence_each() {
        var keyArray = objLitConst.keys().toArray();
        var i = 0;
        objLit.keys().each(function(k) {
            assert.strictEqual(k, keyArray[i]);
            i += 1;
        });
    });

    test("KeyIterator.current && moveNext", function KeyIterator_current_moveNext() {
        var keyArray = objLitConst.keys().toArray();
        var kit = objLit.keys().getIterator();
        var i = 0;
        while (kit.moveNext()) {
            assert.strictEqual(kit.current(), keyArray[i]);
            i += 1;
        }
    });

    test("ValueSequence.toArray", function ValueSequence_toArray() {
        var valArray = objLitConst.values().toArray();
        var tmpObj = getNewObjLit();
        var expectedValArray = Object.keys(tmpObj).reduce(function(aggr, k) {
            aggr.push(tmpObj[k])
            return aggr;
        }, []);

        assert.strictEqual(valArray[0], expectedValArray[0]);
        assert.strictEqual(valArray[2], expectedValArray[2]);
    });

    test("ValueSequence.each", function KeySequence_each() {
        var valArray = objLitConst.values().toArray();
        var i = 0;
        objLit.values().each(function(v) {
            assert.strictEqual(v, valArray[i]);
            i += 1;
        });
    });

    test("ValueIterator.current && moveNext", function KeyIterator_current_moveNext() {
        var valArray = objLitConst.values().toArray();
        var vit = objLit.values().getIterator();
        var i = 0;
        while (vit.moveNext()) {
            assert.strictEqual(vit.current(), valArray[i]);
            i += 1;
        }
    });
});
